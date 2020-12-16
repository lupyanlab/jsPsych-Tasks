from __future__ import annotations
import os
from shutil import copyfile
from utils.balance_utils.get_next_min_key import get_next_min_key
from utils.balance_utils.create_counts_file import create_counts_file
from utils.csv.get_remaining_trials import get_remaining_trials_with_trial_nums
from utils.csv.append_to_csv import append_to_csv
from utils.csv.write_to_csv import write_to_csv
from utils.csv.read_rows import read_rows
from utils.get_random_username import get_random_username
from utils.mkdir import mkdir
from utils.paths.get_dirname import get_dirname
from utils.paths.create_join_paths_function_with_base_path_check import (
    create_join_paths_function_with_base_path_check as create_join_paths_fn
)
from utils.shuffle_without_catch_in_front import shuffle_without_catch_in_front

dirname = get_dirname(__file__)

TRIAL_NUM_COLUMN = "trial_num"


class Task:
    def __init__(self, dev=False):
        env_folder_path = dirname / ("dev" if dev else "prod")
        mkdir(env_folder_path)
        self.join_paths_env = create_join_paths_fn(env_folder_path)

        self.join_paths_trials = create_join_paths_fn(env_folder_path / "trials", mkdir=True)
        self.join_paths_data = create_join_paths_fn(env_folder_path / "data", mkdir=True)
        self.join_paths_demographics = create_join_paths_fn(
            env_folder_path / "demographics", mkdir=True
        )
        self.join_paths_consent = create_join_paths_fn(env_folder_path / "consent", mkdir=True)
        self.trial_lists_folder = self.join_paths_env("trial_lists")
        self.join_paths_trial_lists = create_join_paths_fn(self.trial_lists_folder)
        self.counts_file_path = self.join_paths_env("counts.csv")

    def trials(self, worker_id: str = get_random_username(), reset: bool = False):
        trials_file_path = self.join_paths_trials(f"{worker_id}.csv")
        demographics_file_path = self.join_paths_demographics(f"{worker_id}.csv")
        consent_file_path = self.join_path_consent(self.consent_folder_path, f"{worker_id}.csv")

        if reset or not trials_file_path.exists():
            data_file_path = self.join_paths_env(
                self.data_folder_path, f"{worker_id}.csv", rm=True
            )
            trials = self._generate_trials(worker_id)

            demographics_file_path.unlink(missing_ok=True)
            consent_file_path.unlink(missing_ok=True)
            completed_demographics = False
            consent_agreed = False
        else:
            trials, num_trials = get_remaining_trials_with_trial_nums(
                trials_file_path,
                data_file_path,
                column=TRIAL_NUM_COLUMN,
            )

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
        data_file_path = self.join_paths_env(self.data_folder_path, f"{worker_id}.csv")
        append_to_csv(data_file_path, data)

    def demographics(self, worker_id: str, demographics: dict):
        demographics_file_path = self.join_paths_env(
            self.demographics_folder_path, f"{worker_id}.csv"
        )
        write_to_csv(demographics_file_path, demographics)

    def consent(self, worker_id: str):
        """
        Endpoint to mark consent as agreed.
        """
        consent_file_path = self.join_paths_env(self.consent_folder_path, f"{worker_id}.txt")
        consent_file_path.touch()
        consent_file_path.write_text("agreed")

    ########################################################
    # HELPERS
    ########################################################
    def _generate_trials(self, worker_id: str):
        # Get assigned trial list
        if not self.counts_file_path.exists():
            trial_lists = os.listdir(self.trial_lists_folder)
            create_counts_file(self.counts_file_path, trial_lists)
        trial_list = get_next_min_key(self.counts_file_path)

        # Copy assigned trial list to trials folder
        trial_list_path = self.join_paths_trial_lists(trial_list)
        trial_file_path = self.join_paths_trials(f"{worker_id}.csv")
        copyfile(trial_list_path, trial_file_path)
        trials = read_rows(trial_file_path)
        trials = shuffle_without_catch_in_front(trials, 15)

        # Add the trial_num column to the trials
        trials = [{TRIAL_NUM_COLUMN: index + 1, **row} for index, row in enumerate(trials)]

        return trials
