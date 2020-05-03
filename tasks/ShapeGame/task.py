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
    self.images_folder_path = dirname + '/vcs_shapes/'
    self.trial_lists_folder_path = dirname + '/trial_lists/'

    env_folder_path = dirname + ('/dev/' if dev else '/prod/')
    if not os.path.exists(env_folder_path):
      os.mkdir(env_folder_path)

    self.trials_folder_path = env_folder_path + '/trials/'
    self.data_folder_path = env_folder_path + '/data/'
    self.demographics_folder_path = env_folder_path + '/demographics/'
    self.trial_list_counts_file_path = env_folder_path + '/trial_list_counts.csv'
    self.consent_folder_path = env_folder_path + '/consent/'
    self.vcs_names_file_path = env_folder_path + '/vcs_names.csv'

  def trials(self, worker_id, randomize_order=True, reset=False):
    if not os.path.exists(self.trials_folder_path):
      os.mkdir(self.trials_folder_path)
    trials_file_path = self.trials_folder_path + '/' + worker_id + '.csv'
    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'

    score = 0
    bonus = 0
    if reset or not os.path.exists(trials_file_path):
      remove_files(demographics_file_path, consent_file_path, data_file_path, trials_file_path)
      trials = self.generate_trials(worker_id, randomize_order)
      num_trials = len(trials)
      write_to_csv(trials_file_path, trials)
      completed_demographics = False
      consent_agreed = False

    else:
      trials = read_rows(trials_file_path)
      num_trials = len(trials)
      if os.path.exists(data_file_path):
        data = read_rows(data_file_path)
        num_data_rows = len(data)
        if num_data_rows > 0:
          score = data[-1]['score']
          bonus = data[-1]['bonus']
        trials = trials[num_data_rows:]
      completed_demographics = os.path.exists(demographics_file_path)
      consent_agreed = os.path.exists(consent_file_path)

    return {
        "trials": trials,
        "num_trials": num_trials,
        "completed_demographics": completed_demographics,
        "consent_agreed": consent_agreed,
        "rel_images_folder_path": os.path.relpath(self.images_folder_path, dirname),
        "score": score,
        "bonus": bonus,
    }

  def consent(self, worker_id):
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    if not os.path.exists(self.consent_folder_path):
      os.mkdir(self.consent_folder_path)
    write_to_csv(consent_file_path, {'response': 'yes'})
    return 200

  def data(self, worker_id, **data):
    if not os.path.exists(self.data_folder_path):
      os.mkdir(self.data_folder_path)

    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'

    response = data['response']

    score = 0
    if os.path.exists(data_file_path):
      last_row = read_last_row(data_file_path)
      score = int(last_row['score'])

    image = data['stim_to_show']

    num_responses = 1
    num_same_responses = 1
    response_counts = {}
    with update_responses_file_lock:
      if os.path.exists(self.vcs_names_file_path):
        rows = read_rows(self.vcs_names_file_path)
        logger.info(rows)
        for row in rows:
          if image == row['image']:
            if response == row['naming_response']:
              num_same_responses += 1
            num_responses += 1

      append_to_csv(self.vcs_names_file_path, {'image': image, 'naming_response': response})

    logger.info('num_same_responses: ' + str(num_same_responses))
    logger.info('num_responses: ' + str(num_responses))
    score += self.compute_score(num_same_responses, num_responses)
    bonus = self.compute_bonus(score)
    data['score'] = score
    data['bonus'] = bonus

    logger.info("num_responses: " + str(num_responses))

    append_to_csv(data_file_path, data)

    return {'score': score, 'bonus': bonus}

  def demographics(self, worker_id, demographics):
    if not os.path.isdir(self.demographics_folder_path):
      os.mkdir(self.demographics_folder_path)

    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'

    write_to_csv(demographics_file_path, demographics)

    return 200

  ########################################################
  # HELPERS
  ########################################################
  def generate_trials(self, worker_id, randomize_order):
    trial_lists = os.listdir(self.trial_lists_folder_path)
    trial_list = get_next_min_key(update_images_counts_file_lock, self.trial_list_counts_file_path,
                                  trial_lists)

    trial_list_rows = read_rows(self.trial_lists_folder_path + '/' + trial_list)
    if randomize_order:
      random.shuffle(trial_list_rows)

    trials = [
        dict({'trial_number': index + 1}, **row) for index, row in enumerate(trial_list_rows)
    ]

    return trials

  def compute_score(self, num_same_responses, num_responses):
    return int(math.ceil(num_same_responses / float(num_responses) * 10))

  def compute_bonus(self, score):
    return round_nearest_05(score * 0.3)
