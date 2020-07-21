import pandas as pd
import numpy as np
import os
import csv
from threading import Lock
import random
import copy
from collections import defaultdict
import math

from utils.csv_utils import *
from utils.balance_utils import *
from utils.round import round_nearest_05
from client.logger import logger

dirname = os.path.dirname(__file__)

# Need a lock for updating a file shared by all worker_ids
# this includes the images_counts_file
update_images_counts_file_lock = Lock()
update_responses_file_lock = Lock()


class Task:
  def __init__(self, dev=False):
    self.words_folder_path = dirname + '/word_to_rate/'

    env_folder_path = dirname + ('/dev/' if dev else '/prod/')
    if not os.path.exists(env_folder_path):
      os.mkdir(env_folder_path)

    self.trials_folder_path = env_folder_path + '/trials/'
    self.data_folder_path = env_folder_path + '/data/'
    self.demographics_folder_path = env_folder_path + '/demographics/'
    self.trial_list_counts_file_path = env_folder_path + '/trial_list_counts.csv'
    self.consent_folder_path = env_folder_path + '/consent/'
    self.batch_num_folder_path = env_folder_path + '/batch_num/'

  def trials(self, worker_id, new_batch=None, max_batch_num=None, reset=False):
    if not os.path.exists(self.trials_folder_path):
      os.mkdir(self.trials_folder_path)
    if not os.path.exists(self.batch_num_folder_path):
      os.mkdir(self.batch_num_folder_path)
    trials_file_path = self.trials_folder_path + '/' + worker_id + '.csv'
    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    data_file_path = self.data_folder_path + '/' + worker_id + '_data.csv'
    batch_num_file_path = self.batch_num_folder_path + '/' + worker_id + '.csv'

    if reset or not os.path.exists(trials_file_path):
      remove_files(demographics_file_path, consent_file_path, data_file_path, trials_file_path,
                   batch_num_file_path)
      trials = self.generate_trials(worker_id)
      num_trials = len(trials)
      write_to_csv(trials_file_path, trials)
      curr_batch_num = 1
      write_key_value(batch_num_file_path, {
          "curr_batch_num": curr_batch_num,
          "max_batch_num": max_batch_num
      })
      completed_demographics = False
      consent_agreed = False
    else:
      batch_num_data = read_key_value(batch_num_file_path)
      curr_batch_num = int(batch_num_data["curr_batch_num"])
      max_batch_num = None if len(
          batch_num_data["max_batch_num"]) == 0 else batch_num_data["max_batch_num"]

      trials = read_rows(trials_file_path)
      num_trials = len(trials)
      completed_demographics = os.path.exists(demographics_file_path)
      consent_agreed = os.path.exists(consent_file_path)

      if new_batch is not None and new_batch:
        trials = self.generate_trials(worker_id, len(trials))
        num_trials += len(trials)
        append_to_csv(trials_file_path, trials)

        curr_batch_num += 1
        logger.info("curr_batch_num: %s", curr_batch_num)
        write_key_value(batch_num_file_path, {
            "curr_batch_num": curr_batch_num,
            "max_batch_num": max_batch_num
        })

      else:
        num_trials = len(trials)
        if os.path.exists(data_file_path):
          data = read_rows(data_file_path)
          num_data_rows = len(data)
          trials = trials[num_data_rows:]

    return {
        "trials": trials,
        "num_trials": num_trials,
        "completed_demographics": completed_demographics,
        "consent_agreed": consent_agreed,
        "curr_batch_num": curr_batch_num,
        "max_batch_num": max_batch_num,
    }

  def consent(self, worker_id):
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    if not os.path.exists(self.consent_folder_path):
      os.mkdir(self.consent_folder_path)
    write_to_csv(consent_file_path, {'response': 'yes'})
    return 200

  def data(self, worker_id, order, data):
    if not os.path.exists(self.data_folder_path):
      os.mkdir(self.data_folder_path)

    data_file_path = self.data_folder_path + '/' + worker_id + '_data.csv'
    append_to_csv(data_file_path, data, order=order)

  def demographics(self, worker_id, demographics):
    if not os.path.isdir(self.demographics_folder_path):
      os.mkdir(self.demographics_folder_path)

    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '_demographics.csv'

    write_to_csv(demographics_file_path,
                 dict({"subj_code": worker_id}, **demographics),
                 order=["subj_code"] + demographics.keys())

    return 200

  ########################################################
  # HELPERS
  ########################################################
  def generate_trials(self, worker_id, curr_trial_num=0):
    word_lists_names = os.listdir(self.words_folder_path)
    word_list_name = get_next_min_keys(update_images_counts_file_lock,
                                       self.trial_list_counts_file_path, word_lists_names, 1)

    trial_list_rows = []
    for w in word_list_name:
      trial_list_rows += read_rows(self.words_folder_path + '/' + w, delimiter="\t")

    trials = self.shuffle_without_catch_in_front(trial_list_rows, 15)

    trials = [
        dict({'trial_number': curr_trial_num + index + 1}, **row)
        for index, row in enumerate(trial_list_rows)
    ]
    return trials

  def shuffle_without_catch_in_front(self, trials, num_first_trials_not_catch):
    no_catch_first_trials = False
    while not no_catch_first_trials:
      random.shuffle(trials)
      no_catch_first_trials = all(trial["question_type"] != "catch"
                                  for trial in trials[:num_first_trials_not_catch])
    return trials
