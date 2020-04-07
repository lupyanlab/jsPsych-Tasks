import pandas as pd
import numpy as np
import os

# TODO: Switch to use kwargs
def generate_trials(worker_id):
  trials_folder_path = './trials'
  if not os.path.exists(trials_folder_path):
    os.mkdir(trials_folder_path)
  return []


def trials(request_body):
  worker_id = request_body["worker_id"]
  trials_file_path = './trials/' + worker_id + '.py'

  if not os.path.isfile(trials_file_path):
    trials = generate_trials(worker_id)
    pd.DataFrame(trials).to_csv('out.csv')
  else:
    trials = dict(pd.read_csv('out.csv'))

  return {"trials": trials, "score": 109, "current_bonus": 0.35}

def data(request_body):
  data_folder_path = './data'
  if not os.path.exists(data_folder_path):
    os.mkdir(data_folder_path)
