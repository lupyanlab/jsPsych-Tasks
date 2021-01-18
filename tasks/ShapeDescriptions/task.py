from __future__ import annotations

import json
from os import mkdir
from random import choice, shuffle
from time import time

from task_runner.app import app
from utils.balance_utils.create_counts_file import create_counts_file
from utils.balance_utils.get_next_min_key import get_next_min_key
from utils.balance_utils.get_next_min_keys import get_next_min_keys
from utils.constants import ENV_FOLDER_PATH_KEY
from utils.csv.append_to_csv import append_to_csv
from utils.csv.get_remaining_trials import get_remaining_trials_with_trial_nums
from utils.csv.read_rows import read_rows
from utils.csv.write_to_csv import write_to_csv
from utils.get_random_username import get_random_username
from utils.listdir import listdir
from utils.paths.create_join_paths_fn import create_join_paths_fn as create_safe_join_paths_fn
from utils.paths.get_dirname import get_dirname
from utils.remove_files import remove_files

dirname = get_dirname(__file__)

TRIAL_NUM_COLUMN = "trial_num"
NUM_LEADING_NON_CATCH_TRIALS = 4
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

        self.trial_lists_folder_path = dirname / "trial_files"
        self.withLabels_folder_path = self.trial_lists_folder_path / "withLabels"
        self.noLabels_folder_path = self.trial_lists_folder_path / "noLabels"

        # dev/prod folders/files
        self.noLabels_counts_file_path = env_folder_path / "noLabels_counts.csv"
        self.withLabels_counts_file_path = env_folder_path / "withLabels_counts.csv"

        create_safe_join_paths_fn_env = lambda folder: create_safe_join_paths_fn(
            env_folder_path / folder, mkdir=True
        )
        self.safe_join_paths_trials = create_safe_join_paths_fn_env("trials")
        self.safe_join_paths_data = create_safe_join_paths_fn_env("data")
        self.safe_join_paths_demographics = create_safe_join_paths_fn_env("demographics")
        self.safe_join_paths_consent = create_safe_join_paths_fn_env("consent")

        # self.safe_join_paths_stimuli = create_safe_join_paths_fn(dirname / "stimuli")
        self.stimuli_folder_path = dirname / "stimuli"

    def trials(self, worker_id: str = None, reset: bool = False):
        # If worker_id not provided, generate a random username with the seconds
        # # since the epoch appended at the end.
        if worker_id is None:
            worker_id = f"{get_random_username()}_{int(time())}"
        trials_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")
        demographics_file_path = self.safe_join_paths_demographics(f"{worker_id}.csv")
        consent_file_path = self.safe_join_paths_consent(f"{worker_id}.txt")
        data_file_path = self.safe_join_paths_data(f"{worker_id}.csv")

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

            # Parse the CSV strings into their proper data type
            for trial in trials:
                trial["stimuli"] = json.loads(trial["stimuli"].replace("'", '"'))
                trial[TRIAL_NUM_COLUMN] = int(trial[TRIAL_NUM_COLUMN])

            completed_demographics = demographics_file_path.exists()
            consent_agreed = consent_file_path.exists()

        return {
            "trials": trials,
            "num_trials": num_trials,
            "completed_demographics": completed_demographics,
            "consent_agreed": consent_agreed,
            "worker_id": worker_id,
        }

    def data(self, worker_id: str, data: dict):
        data_file_path = self.safe_join_paths_data(f"{worker_id}.csv")
        append_to_csv(data_file_path, data)

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
        if not self.noLabels_counts_file_path.exists():
            trial_lists = [
                trial_list_path.name for trial_list_path in listdir(self.noLabels_folder_path)
            ]
            create_counts_file(self.noLabels_counts_file_path, trial_lists)

        if not self.withLabels_counts_file_path.exists():
            trial_lists = [
                trial_list_path.name for trial_list_path in listdir(self.withLabels_folder_path)
            ]
        noLabels_trial_lists = get_next_min_keys(self.noLabels_counts_file_path, 4)
        noLabels_file_path = [self.noLabels_folder_path / noLabels_trial_list for noLabels_trial_list in noLabels_trial_lists]
        withLabels_trial_lists = get_next_min_keys(self.withLabels_counts_file_path, 4)
        withLabels_file_path = [self.withLabels_folder_path / withLabels_trial_list for withLabels_trial_list in withLabels_trial_lists]

        stimuli_names = [
            stim_file_path.name for stim_file_path in listdir(self.stimuli_folder_path)
        ]
        trials = []
        for file_path in (noLabels_file_path+withLabels_file_path):
            rows = read_rows(file_path)
            for row in rows:
                a_left = choice([True, False])
                if a_left:
                    row["left"] = "A"
                    row["right"] = "B"
                else:
                    row["left"] = "B"
                    row["right"] = "A"
                row["stimuli"] = stimuli_names
            trials.extend(rows)

        trial_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")

        shuffle(trials)

        # Add the trial_num column to the trials
        trials = [{TRIAL_NUM_COLUMN: index + 1, **row} for index, row in enumerate(trials)]
        write_to_csv(trial_file_path, trials)

        return trials
