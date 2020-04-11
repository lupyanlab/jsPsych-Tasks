import pandas as pd
import numpy as np
import os
import csv
from threading import Lock
import random
import copy

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

  def trials(self, worker_id, num_images, reset=False):
    if not os.path.exists(self.trials_folder_path):
      os.mkdir(self.trials_folder_path)
    trials_file_path = self.trials_folder_path + '/' + worker_id + '.csv'
    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'

    if reset or not os.path.exists(trials_file_path):
      data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
      if os.path.exists(data_file_path):
        os.remove(data_file_path)
      trials = self.generate_trials(worker_id, num_images)
      num_trials = len(trials)

      with open(trials_file_path, 'wb') as f:
        w = csv.DictWriter(f, sorted(trials[0].keys()))
        w.writeheader()
        for trial in trials:
          w.writerow(trial)

      if os.path.exists(demographics_file_path):
        os.remove(demographics_file_path)
      if os.path.exists(consent_file_path):
        os.remove(consent_file_path)
      completed_demographics = False
      consent_agreed = False

    else:
      with open(trials_file_path, 'rb') as t:
        trial_rows = csv.DictReader(t)
        trials = list(trial_rows)
        num_trials = len(trials)
      data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
      if os.path.exists(data_file_path):
        with open(data_file_path, 'rb') as d:
          data_rows = csv.DictReader(d)
          num_data_rows = len(list(data_rows))
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
    with open(consent_file_path, 'wb') as f:
      f.write('yes\n')
    return 200

  def data(self, worker_id, **data):
    if not os.path.exists(self.data_folder_path):
      os.mkdir(self.data_folder_path)

    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
    write_headers = not os.path.exists(data_file_path)

    with open(data_file_path, 'a') as f:
      w = csv.DictWriter(f, sorted(data.keys()))
      if write_headers:
        w.writeheader()
      w.writerow(data)

  def demographics(self, worker_id, demographics):
    if not os.path.isdir(self.demographics_folder_path):
      os.mkdir(self.demographics_folder_path)

    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'

    with open(demographics_file_path, 'wb') as f:
      w = csv.DictWriter(f, sorted(demographics.keys()))
      w.writeheader()
      w.writerow(demographics)

    return 200

  ########################################################
  # HELPERS
  ########################################################
  def create_images_count_file(self):
    image_folders = os.listdir(self.images_folder_path)
    image_counts = {image: 0 for image in image_folders}

    with open(self.image_counts_file_path, 'wb') as f:
      w = csv.DictWriter(f, sorted(image_counts.keys()))
      w.writeheader()
      w.writerow(image_counts)

  def increment_image_counts(self, image_counts, num_images_to_increment):
    new_image_counts = copy.deepcopy(image_counts)
    images_by_count = {}
    for image, count in image_counts.iteritems():
      images_by_count[count] = images_by_count.get(count, []) + [image]

    for count in images_by_count:
      random.shuffle(images_by_count[count])

    final_images = []
    curr_count = None
    for i in range(num_images_to_increment):
      if curr_count is None or len(images_by_count[curr_count]) == 0:
        if curr_count is not None:
          del images_by_count[curr_count]
        curr_count = min(images_by_count.keys())
      image = images_by_count[curr_count].pop(0)
      final_images.append(image)
      new_image_counts[image] += 1
      images_by_count[curr_count + 1] = images_by_count.get(curr_count + 1, []) + [image]

    return new_image_counts, final_images

  def generate_trials(self, worker_id, num_images):
    with update_images_counts_file_lock:
      if not os.path.isfile(self.image_counts_file_path):
        self.create_images_count_file()

      with open(self.image_counts_file_path, 'r+') as f:
        r = csv.DictReader(f)
        last_row = {image: int(count) for image, count in list(r)[-1].iteritems()}
        w = csv.DictWriter(f, r.fieldnames)
        incremented_image_counts, images = self.increment_image_counts(last_row, num_images)
        w.writerow(incremented_image_counts)

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
