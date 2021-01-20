from __future__ import annotations

import math
import os
from os import mkdir
from random import shuffle
from time import time

from task_runner.app import app
from task_runner.logger import logger
from utils.balance_utils.create_counts_file import create_counts_file
from utils.balance_utils.get_next_min_key import get_next_min_key
from utils.constants import ENV_FOLDER_PATH_KEY
from utils.csv.append_to_csv import append_to_csv
from utils.csv.get_remaining_trials import get_remaining_trials_with_trial_nums
from utils.csv.read_last_row import read_last_row
from utils.csv.read_rows import read_rows
from utils.csv.write_to_csv import write_to_csv
from utils.get_random_username import get_random_username
from utils.listdir import listdir
from utils.paths.create_join_paths_fn import create_join_paths_fn as create_safe_join_paths_fn
from utils.paths.get_dirname import get_dirname
from utils.remove_files import remove_files
from utils.round_nearest_05 import round_nearest_05

dirname = get_dirname(__file__)

TRIAL_NUM_COLUMN = "trial_num"
QUESTION_TYPE_COLUMN = "question_type"
CATCH_VALUE = "catch"


class Task:
    def __init__(self, dev=False):
        env_folder_path = dirname / ("dev" if dev else "prod")

        # This is for different environments that can be set in Pytest
        if ENV_FOLDER_PATH_KEY in app.config:
            env_folder_path = app.config[ENV_FOLDER_PATH_KEY]

        if not env_folder_path.exists():
            mkdir(env_folder_path)

        self.trial_lists_folder_path = dirname / "trial_lists"
        self.images_folder_path = dirname / "vcs_shapes"

        # dev/prod folders/files
        self.counts_file_path = env_folder_path / "counts.csv"
        self.vcs_names_file_path = env_folder_path / "vcs_names.csv"

        # dev/prod folder join paths functions for below to use
        create_safe_join_paths_fn_env = lambda folder: create_safe_join_paths_fn(
            env_folder_path / folder, mkdir=True
        )
        self.safe_join_paths_trials = create_safe_join_paths_fn_env("trials")
        self.safe_join_paths_data = create_safe_join_paths_fn_env("data")
        self.safe_join_paths_demographics = create_safe_join_paths_fn_env("demographics")
        self.safe_join_paths_consent = create_safe_join_paths_fn_env("consent")

    def trials(self, worker_id: str = None, reset: bool = False):
        # If worker_id not provided, generate a random username with the seconds
        # # since the epoch appended at the end.
        if worker_id is None:
            worker_id = f"{get_random_username()}_{int(time())}"
        trials_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")
        demographics_file_path = self.safe_join_paths_demographics(f"{worker_id}.csv")
        consent_file_path = self.safe_join_paths_consent(f"{worker_id}.txt")
        data_file_path = self.safe_join_paths_data(f"{worker_id}.csv")

        score = 0
        bonus = 0
        if reset or not trials_file_path.exists():
            remove_files(
                demographics_file_path, consent_file_path, data_file_path, trials_file_path
            )
            trials = self._generate_trials(worker_id)
            num_trials = len(trials)

            completed_demographics = False
            consent_agreed = False
        else:
            trials, num_trials = get_remaining_trials_with_trial_nums(
                trials_file_path,
                data_file_path,
                trial_num_column_name=TRIAL_NUM_COLUMN,
            )
            if os.path.exists(data_file_path):
                data = read_rows(data_file_path)
                num_data_rows = len(data)
                if num_data_rows > 0:
                    score = data[-1]["score"]
                    bonus = data[-1]["bonus"]
            # Parse the CSV strings into their proper data type
            for trial in trials:
                trial[TRIAL_NUM_COLUMN] = int(trial[TRIAL_NUM_COLUMN])

            completed_demographics = demographics_file_path.exists()
            consent_agreed = consent_file_path.exists()

        return {
            "trials": trials,
            "num_trials": num_trials,
            "completed_demographics": completed_demographics,
            "consent_agreed": consent_agreed,
            "worker_id": worker_id,
            "rel_images_folder_path": os.path.relpath(self.images_folder_path, dirname),
            "score": score,
            "bonus": bonus,
        }

    def data(self, worker_id: str, data: dict):
        data_file_path = self.safe_join_paths_data(f"{worker_id}.csv")

        response = data['response']

        score = 0
        if os.path.exists(data_file_path):
            last_row = read_last_row(data_file_path)
            score = int(last_row['score'])

        image = data['stim_to_show']

        num_responses = 1
        num_same_responses = 1
        if os.path.exists(self.vcs_names_file_path):
            rows = read_rows(self.vcs_names_file_path)
            logger.info(rows)
            for row in rows:
                if image == row['image']:
                    if response == row['naming_response']:
                        num_same_responses += 1
                num_responses += 1

        append_to_csv(self.vcs_names_file_path, {'image': image, 'naming_response': response})

        logger.info("num_same_responses: %s", num_same_responses)
        logger.info("num_responses: %s", num_responses)
        score += self.compute_score(num_same_responses, num_responses)
        bonus = self.compute_bonus(score)
        data["score"] = score
        data["bonus"] = bonus

        logger.info("num_responses: %s", num_responses)

        append_to_csv(data_file_path, data)

        return {'score': score, 'bonus': bonus}

    def demographics(self, worker_id: str, demographics: dict):
        demographics_file_path = self.safe_join_paths_demographics(f"{worker_id}.csv")
        write_to_csv(demographics_file_path, demographics)

    def consent(self, worker_id: str):
        """
        Endpoint to mark consent as agreed.
        """
        consent_file_path = self.safe_join_paths_consent(f"{worker_id}.txt")
        consent_file_path.touch()
        consent_file_path.write_text("agreed")

    ########################################################
    # HELPERS
    ########################################################
    def _generate_trials(self, worker_id: str):
        # Get assigned trial list
        if not self.counts_file_path.exists():
            trial_lists = [
                trial_list_path.name for trial_list_path in listdir(self.trial_lists_folder_path)
            ]
            create_counts_file(self.counts_file_path, trial_lists)
        trial_list = get_next_min_key(self.counts_file_path)

        # Copy assigned trial list to trials folder
        trial_list_path = self.trial_lists_folder_path / trial_list
        trial_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")
        trials = read_rows(trial_list_path)
        shuffle(trials)

        # Add the trial_num column to the trials
        trials = [{TRIAL_NUM_COLUMN: index + 1, **row} for index, row in enumerate(trials)]
        write_to_csv(trial_file_path, trials)

        return trials

    def compute_score(self, num_same_responses, num_responses):
        return int(math.ceil(num_same_responses / float(num_responses) * 10))

    def compute_bonus(self, score):
        return round_nearest_05(score * 0.3)
