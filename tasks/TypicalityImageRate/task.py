import pandas as pd
import numpy as np
import os
import csv
from threading import Lock
import random
import copy

from utils.balance_utils import *
from utils.csv_utils import *
from client.logger import logger

dirname = os.path.dirname(__file__)

# Need a lock for updating a file shared by all worker_ids
# this includes the images_counts_file
update_images_counts_file_lock = Lock()


class Task:
  def __init__(self, dev=False):
    self.images_folder_path = dirname + '/images/'

    env_folder_path = dirname + ('/dev/' if dev else '/prod/')
    if not os.path.exists(env_folder_path):
      os.mkdir(env_folder_path)

    self.trials_folder_path = env_folder_path + '/trials/'
    self.data_folder_path = env_folder_path + '/data/'
    self.demographics_folder_path = env_folder_path + '/demographics/'
    self.image_counts_file_path = env_folder_path + '/image_counts.csv'
    self.consent_folder_path = env_folder_path + '/consent/'

  def trials(self, worker_id, num_categories=None, reset=False):
    if not os.path.exists(self.trials_folder_path):
      os.mkdir(self.trials_folder_path)
    trials_file_path = self.trials_folder_path + '/' + worker_id + '.csv'
    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'

    if reset or not os.path.exists(trials_file_path):
      remove_files(demographics_file_path, consent_file_path, data_file_path, trials_file_path)
      trials = self.generate_trials(worker_id, num_categories)
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
        trials = trials[num_data_rows:]
      completed_demographics = os.path.exists(demographics_file_path)
      consent_agreed = os.path.exists(consent_file_path)

    return {
        "trials": trials,
        "num_trials": num_trials,
        "completed_demographics": completed_demographics,
        "consent_agreed": consent_agreed,
        "rel_images_folder_path": os.path.relpath(self.images_folder_path, dirname)
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
    append_to_csv(data_file_path, data)

  def demographics(self, worker_id, demographics):
    if not os.path.isdir(self.demographics_folder_path):
      os.mkdir(self.demographics_folder_path)

    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'

    write_to_csv(demographics_file_path, demographics)

    return 200

  ########################################################
  # HELPERS
  ########################################################

  def generate_trials(self, worker_id, num_categories=None):
    image_folders = os.listdir(self.images_folder_path)
    logger.info("num_categories: %s", num_categories)
    images = get_next_min_keys(update_images_counts_file_lock, self.image_counts_file_path,
                               image_folders, num_categories if num_categories is not None else len(image_folders))
    logger.info("images %s", images)
    trials = []
    trial_number = 0
    for image in images:
      image_trials = []
      for image_file in os.listdir(self.images_folder_path + '/' + image):
        image_trials.append({
            'category': image,
            'image': image_file,
            'trial_number': trial_number,
            'keys': "1,2,3,4,5",
            'labels': "1 (Very typical),2,3,4,5 (Very atypical)"
        })
        trial_number += 1
      trials.extend(image_trials)

    return trials
