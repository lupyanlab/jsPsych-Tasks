from __future__ import annotations

from time import time

from task_runner.app import app
from utils.balance_utils.create_counts_file import create_counts_file
from utils.balance_utils.get_next_min_key import get_next_min_key
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
from utils.shuffle_without_catch_in_front import shuffle_without_catch_in_front

dirname = get_dirname(__file__)

TRIAL_NUM_COLUMN = "trial_num"
NUM_LEADING_NON_CATCH_TRIALS = 2
QUESTION_TYPE_COLUMN = "question_type"
CATCH_VALUE = "catch"


class Task:
    def __init__(self, dev=False):
        env_folder_path = dirname / ("dev" if dev else "prod")

        # This is for different environments that can be set in Pytest
        if ENV_FOLDER_PATH_KEY in app.config:
            env_folder_path = app.config[ENV_FOLDER_PATH_KEY]

        self.trial_lists_folder = dirname / "trial_lists"

        # dev/prod folders/files
        self.counts_file_path = env_folder_path / "counts.csv"

        # dev/prod folder join paths functions for below to use
        create_safe_join_paths_fn_env = lambda folder: create_safe_join_paths_fn(
            env_folder_path / folder, mkdir=True
        )
        self.safe_join_paths_trials = create_safe_join_paths_fn_env("trials")
        self.safe_join_paths_data = create_safe_join_paths_fn_env("data")
        self.safe_join_paths_demographics = create_safe_join_paths_fn_env("demographics")
        self.safe_join_paths_consent = create_safe_join_paths_fn_env("consent")

    def trials(
        self,
        # If not provided, generate a random username with the seconds
        # # since the epoch appended at the end.
        worker_id: str = f"{get_random_username()}_{int(time())}",
        reset: bool = False
    ):
        trials_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")
        demographics_file_path = self.safe_join_paths_demographics(f"{worker_id}.csv")
        consent_file_path = self.safe_join_paths_consent(f"{worker_id}.txt")
        data_file_path = self.safe_join_paths_data(f"{worker_id}.csv", rm=True)

        if reset or not trials_file_path.exists():
            trials = self._generate_trials(worker_id)
            num_trials = len(trials)

            remove_files(demographics_file_path, consent_file_path)
            completed_demographics = False
            consent_agreed = False
        else:
            trials, num_trials = get_remaining_trials_with_trial_nums(
                trials_file_path,
                data_file_path,
                trial_num_column_name=TRIAL_NUM_COLUMN,
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
        # Get assigned trial list
        if not self.counts_file_path.exists():
            trial_lists = listdir(self.trial_lists_folder)
            create_counts_file(self.counts_file_path, trial_lists)
        trial_list = get_next_min_key(self.counts_file_path)

        # Copy assigned trial list to trials folder
        trial_list_path = self.trial_lists_folder / trial_list
        trial_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")
        trials = read_rows(trial_list_path)
        trials = shuffle_without_catch_in_front(
            trials,
            NUM_LEADING_NON_CATCH_TRIALS,
            type_key=QUESTION_TYPE_COLUMN,
            catch_type_value=CATCH_VALUE
        )

        # Add the trial_num column to the trials
        trials = [{TRIAL_NUM_COLUMN: index + 1, **row} for index, row in enumerate(trials)]
        write_to_csv(trial_file_path, trials)

        return trials
