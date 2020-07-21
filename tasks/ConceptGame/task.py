import pandas as pd
import numpy as np
import os
import csv
from threading import Lock
import random
import copy
from collections import defaultdict
import math
import json

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
    self.trial_lists_folder_path = dirname + '/trial_lists/'

    env_folder_path = dirname + ('/dev/' if dev else '/prod/')
    if not os.path.exists(env_folder_path):
      os.mkdir(env_folder_path)

    self.trials_folder_path = env_folder_path + '/trials/'
    self.data_folder_path = env_folder_path + '/data/'
    self.demographics_folder_path = env_folder_path + '/demographics/'
    self.trial_list_counts_file_path = env_folder_path + '/trial_list_counts.csv'
    self.trial_counts_file_path = env_folder_path + '/trial_counts.csv'
    self.consent_folder_path = env_folder_path + '/consent/'
    self.concept_responses = env_folder_path + '/concept_responses.csv'
    self.batch_num_folder_path = env_folder_path + '/batch_num/'

  def trials(self,
             worker_id,
             randomize_order=True,
             new_batch=None,
             max_batch_num=None,
             reset=False):
    if not os.path.exists(self.trials_folder_path):
      os.mkdir(self.trials_folder_path)
    if not os.path.exists(self.batch_num_folder_path):
      os.mkdir(self.batch_num_folder_path)
    trials_file_path = self.trials_folder_path + '/' + worker_id + '.csv'
    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
    batch_num_file_path = self.batch_num_folder_path + '/' + worker_id + '.csv'

    score = 0
    if reset or not os.path.exists(trials_file_path):
      remove_files(demographics_file_path, consent_file_path, data_file_path, trials_file_path,
                   batch_num_file_path)
      trials, batch = self.generate_trials(worker_id, randomize_order)
      num_trials = len(trials)
      curr_batch_num = 1
      write_to_csv(trials_file_path, trials)
      write_key_value(batch_num_file_path, {"batches": batch, "max_batch_num": max_batch_num})
      completed_demographics = False
      consent_agreed = False

    else:
      batch_num_data = read_key_value(batch_num_file_path)
      batches = batch_num_data['batches'].split(',')
      max_batch_num = None if len(
          batch_num_data["max_batch_num"]) == 0 else batch_num_data["max_batch_num"]

      curr_batch_num = len(batches)
      trials = read_rows(trials_file_path)
      num_trials = len(trials)
      if os.path.exists(data_file_path):
        data = read_rows(data_file_path)
        num_data_rows = len(data)
        if num_data_rows > 0:
          score = data[-1]['score']
      completed_demographics = os.path.exists(demographics_file_path)
      consent_agreed = os.path.exists(consent_file_path)

      if new_batch is not None and new_batch:
        trials, batch = self.generate_trials(worker_id,
                                             curr_trial_num=len(trials),
                                             completed_batches=batches)
        if batch is not None:
          num_trials += len(trials)
          append_to_csv(trials_file_path, trials)
          batches.append(batch)
          curr_batch_num += 1
          logger.info("curr_batch_num: %s", curr_batch_num)
          write_key_value(batch_num_file_path, {
              "batches": ','.join(batches),
              "max_batch_num": max_batch_num
          })
      else:
        if os.path.exists(data_file_path):
          trials = trials[num_data_rows:]
        batch_num_data = read_key_value(batch_num_file_path)
        batches = batch_num_data['batches'].split(',')
        batch = batches[-1]

    return {
        "trials": trials,
        "num_trials": num_trials,
        "completed_demographics": completed_demographics,
        "consent_agreed": consent_agreed,
        "score": score,
        "curr_batch_num": curr_batch_num,
        "max_batch_num": max_batch_num,
        "batch": batch,
    }

  def rank(self, worker_id):
    return {"rank": self.compute_weighted_rank(worker_id)}

  def consent(self, worker_id):
    """
    Endpoint to mark consent as agreed.
    """
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    if not os.path.exists(self.consent_folder_path):
      os.mkdir(self.consent_folder_path)
    write_to_csv(consent_file_path, {'response': 'yes'})
    return 200

  def data(self, worker_id, **data):
    if not os.path.exists(self.data_folder_path):
      os.mkdir(self.data_folder_path)

    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'

    you_response = int(data['you_choice'])
    others_response = int(data['others_choice'])

    score = 0
    reward = 0
    mean = None
    if os.path.exists(data_file_path):
      last_row = read_last_row(data_file_path)
      score = int(last_row['score'])

    concept = data['concept']
    anchor_neg = data['anchor_neg']
    anchor_pos = data['anchor_pos']

    num_responses = 1
    response_counts = {}
    choice_counts = [0, 0, 0, 0, 0, 0, 0]
    key = ','.join([concept, anchor_neg, anchor_pos])
    with update_responses_file_lock:
      if os.path.exists(self.concept_responses):
        response_counts = read_key_value(self.concept_responses)
        if key in response_counts:
          choice_counts = [int(count) for count in response_counts[key].split(",")]
        logger.info('choice_counts: %s', choice_counts)
        reward, mean = self.compute_reward(others_response, choice_counts)
        score += reward
      choice_counts[int(you_response) - 1] += 1
      response_counts[key] = ','.join([str(count) for count in choice_counts])
      write_key_value(self.concept_responses, response_counts)

    logger.info('num_responses: ' + str(num_responses))
    # Assumes score and reward will always be ints
    data['score'] = int(score)
    data['reward'] = int(reward)

    append_to_csv(data_file_path, data)

    return {"score": score, "reward": reward, "mean": mean}

  def demographics(self, worker_id, demographics):
    if not os.path.isdir(self.demographics_folder_path):
      os.mkdir(self.demographics_folder_path)

    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'

    write_to_csv(demographics_file_path, demographics)

    return 200

  ########################################################
  # HELPERS
  ########################################################
  def generate_trials(self,
                      worker_id,
                      randomize_order=True,
                      completed_batches=None,
                      curr_trial_num=0):
    trial_lists = os.listdir(self.trial_lists_folder_path)
    if completed_batches is None:
      trial_list = get_next_min_key(update_images_counts_file_lock,
                                    self.trial_list_counts_file_path, trial_lists)
    else:
      logger.info("completed_batches: %s", completed_batches)
      ordered_trial_lists = get_next_min_keys(update_images_counts_file_lock,
                                              self.trial_list_counts_file_path,
                                              trial_lists,
                                              len(trial_lists),
                                              write=False)

      trial_list = next(
          (trial_list
           for trial_list in ordered_trial_lists if trial_list not in set(completed_batches)),
          None)

      if trial_list is None:
        return [], trial_list

    trial_list_rows = read_rows(self.trial_lists_folder_path + '/' + trial_list)
    if randomize_order:
      random.shuffle(trial_list_rows)

    trials = [
        dict({'trial_number': curr_trial_num + index + 1}, **row)
        for index, row in enumerate(trial_list_rows)
    ]

    return trials, trial_list

  def compute_reward(self, selected_choice, choice_counts):
    if sum(choice_counts) == 0:
      return 0, None

    mean = sum((i + 1) * count for i, count in enumerate(choice_counts)) / sum(choice_counts)
    diff = abs(selected_choice - mean)

    if diff < 1:
      return 10, mean
    return math.ceil((len(choice_counts) - 1) - diff), mean

  def compute_weighted_rank(self, worker_id):
    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
    data = read_rows(data_file_path)
    # trials_file_path = self.trials_folder_path + '/' + worker_id + '.csv'
    # trials = read_rows(trials_file_path)
    num_trials = len(data)

    # sum(int(data_row['reward'])] for data_row in data) / float(num_trials)
    score = data[-1]['score']

    total_population_score = 0
    total_num_trials = 0
    files = os.listdir(self.data_folder_path)
    for file in files:
      data = read_rows(self.data_folder_path + '/' + file)
      total_num_trials += len(data)

      total_population_score += read_last_row(self.data_folder_path + '/' + file)['score']

    avg_num_trials = total_num_trials / len(files)
    return score / (num_trials + avg_num_trials) + (
        (total_population_score / total_num_trials) * avg_num_trials /
        (num_trials + avg_num_trials))
