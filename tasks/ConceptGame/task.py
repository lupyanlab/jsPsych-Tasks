from threading import Lock
import math
import json
from enum import Enum
from collections import defaultdict
from random_username.generate import generate_username

from utils.csv_utils import *
from utils.balance_utils import *
from utils.round import round_nearest_05
from client.logger import logger

dirname = os.path.dirname(__file__)

# Need a lock for updating a file shared by all worker_ids
# this includes the images_counts_file
update_images_counts_file_lock = Lock()
update_responses_file_lock = Lock()


class Group(Enum):
  concept = "concept"
  anchor = "anchor"
  none = "none"


class Task:
  def __init__(self, dev=False):
    self.trial_lists_folder_path = dirname + '/trial_lists/'
    self.trial_list_file_path = dirname + '/trial_list.csv'

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
    self.min_max_trials_folder_path = env_folder_path + '/min_max_trials/'

  def trials(self,
             worker_id,
             randomize_order=True,
             max_trials=None,
             min_trials=None,
             reset=False,
             group=Group.none):
    if worker_id is None:
      worker_id = generate_username(1)[0]
    if not os.path.exists(self.trials_folder_path):
      os.mkdir(self.trials_folder_path)
    if not os.path.exists(self.min_max_trials_folder_path):
      os.mkdir(self.min_max_trials_folder_path)
    trials_file_path = self.trials_folder_path + '/' + worker_id + '.csv'
    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
    min_max_trials_file_path = self.min_max_trials_folder_path + '/' + worker_id + '.csv'

    score = 0
    if reset or not os.path.exists(trials_file_path):
      remove_files(demographics_file_path, consent_file_path, data_file_path, trials_file_path)
      trials = self.generate_trials(worker_id, randomize_order, max_trials=max_trials)
      num_trials = len(trials)
      write_to_csv(trials_file_path, trials)
      completed_demographics = False
      consent_agreed = False
      write_key_value(min_max_trials_file_path, {
          "max_trials": max_trials,
          "min_trials": min_trials
      })

    else:
      trials = read_rows(trials_file_path)
      num_trials = len(trials)
      if os.path.exists(data_file_path):
        data = read_rows(data_file_path)
        num_data_rows = len(data)
        if num_data_rows > 0:
          score = data[-1]['score']
      completed_demographics = os.path.exists(demographics_file_path)
      consent_agreed = os.path.exists(consent_file_path)

      if os.path.exists(data_file_path):
        trials = trials[num_data_rows:]

      min_max_trials = read_key_value(min_max_trials_file_path)
      min_trials = min_max_trials["min_trials"]
      min_trials = int(min_trials) if len(min_trials) > 0 else None
      max_trials = min_max_trials["max_trials"]
      max_trials = int(max_trials) if len(max_trials) > 0 else None

    return {
        "trials": trials,
        "num_trials": num_trials,
        "completed_demographics": completed_demographics,
        "consent_agreed": consent_agreed,
        "score": score,
        "max_trials": max_trials,
        "min_trials": min_trials,
        "worker_id": worker_id,
    }

  def rank(self, worker_id):
    return {"weighted_score": self.simple_weighted_score_formula(worker_id)}

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

    if not os.path.exists(self.trial_counts_file_path):
      self.create_trial_counts_file()

    increment_key_count(update_images_counts_file_lock, self.trial_counts_file_path,
                        self.get_trial_key(data))

    return {"score": score, "reward": reward, "mean": mean}

  def demographics(self, worker_id, demographics):
    if not os.path.isdir(self.demographics_folder_path):
      os.mkdir(self.demographics_folder_path)

    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'

    write_to_csv(demographics_file_path, demographics)

    return 200

  def rankings(self, worker_id):
    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
    score = 0
    weighted_score = 0
    rank = 'Unranked'
    if os.path.exists(data_file_path):
      logger.info("'%s' does not exist", data_file_path)
      score = read_last_row(data_file_path)["score"]
      weighted_score = self.simple_weighted_score_formula(worker_id)

    rankings, num_scores = self.get_top_ten_rankings()
    try:
      rank = next(i + 1 for i, v in enumerate(rankings) if worker_id == v[0])
    except StopIteration:
      logger.warn("No matching score found")
      rank = 1

    return {
        "rankings": rankings,
        "score": score,
        "rank": rank,
        "weighted_score": weighted_score,
        "num_scores": num_scores
    }

  ########################################################
  # HELPERS
  ########################################################
  def generate_trials(self,
                      worker_id,
                      randomize_order=True,
                      curr_trial_num=0,
                      max_trials=None,
                      group=Group.none):
    trials = read_rows(self.trial_list_file_path)
    trial_by_index_key = {self.get_trial_key(trial): trial for trial in trials}
    unique_trial_keys = [self.get_trial_key(trial) for trial in trials]

    ordered_trial_keys = get_next_min_keys(
        update_images_counts_file_lock,
        self.trial_counts_file_path,
        unique_trial_keys,
        max_trials if max_trials is not None else len(unique_trial_keys),
        write=False)

    trials = [trial_by_index_key[trial_key] for trial_key in ordered_trial_keys]

    if group != Group.none:
      if group == Group.anchor:
        group_by_label = lambda trial: trial["anchor"]
      else:
        group_by_label = lambda trial: trial["anchor_neg"] + "-" + trial["anchor_pos"]

      trials_by_group = defaultdict(list)
      for trial in trials:
        trials_by_group[group_by_label(trial)].append(trial)

      group_labels = list(trials_by_group.keys())
      random.shuffle(group_labels)
      trials = []
      for group_label in group_labels:
        trials.extend(group_labels[group_label])

    trials = [
        dict({'trial_number': curr_trial_num + index + 1}, **trial)
        for index, trial in enumerate(trials)
    ]

    return trials

  def create_trial_counts_file(self):
    trials = read_rows(self.trial_list_file_path)
    unique_trial_keys = [self.get_trial_key(trial) for trial in trials]
    create_counts_file(self.trial_counts_file_path, unique_trial_keys)

  def get_trial_key(self, trial):
    return ",".join([trial["concept"], trial["anchor_neg"], trial["anchor_pos"]])

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

  def simple_weighted_score_formula(self, worker_id):
    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
    data = read_rows(data_file_path)
    num_trials = len(data)
    score = int(data[-1]['score'])
    average = score / num_trials

    return average * math.sqrt(num_trials)

  def get_top_ten_rankings(self):
    data_files_paths = os.listdir(self.data_folder_path)
    scores = []
    for data_file_path in data_files_paths:
      last_row = read_last_row(self.data_folder_path + "/" + data_file_path)
      worker_id = data_file_path.replace(".csv", "")
      score = float(last_row["score"])
      scores.append([worker_id, score, self.simple_weighted_score_formula(worker_id)])
    scores.sort(key=lambda t: t[2], reverse=True)

    num_scores = len(scores)
    return scores[:10], num_scores
