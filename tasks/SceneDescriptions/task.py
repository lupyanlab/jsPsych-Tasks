from __future__ import annotations

from os import mkdir
from time import time

from task_runner.app import app
from task_runner.logger import logger
from utils.balance_utils.create_counts_file import create_counts_file
from utils.balance_utils.get_next_min_key import get_next_min_key
from utils.constants import ENV_FOLDER_PATH_KEY
from utils.csv.append_to_csv import append_to_csv
from utils.csv.get_fieldnames import get_fieldnames
from utils.csv.get_remaining_trials import get_remaining_trials_with_trial_nums
from utils.csv.parse_str_list import parse_str_list
from utils.csv.read_key_value import read_key_value
from utils.csv.read_rows import read_rows
from utils.csv.write_key_value import write_key_value
from utils.csv.write_to_csv import write_to_csv
from utils.get_random_username import get_random_username
from utils.listdir import listdir
from utils.paths.create_join_paths_fn import create_join_paths_fn as create_safe_join_paths_fn
from utils.paths.get_dirname import get_dirname
from utils.remove_files import remove_files
from utils.shuffle_without_catch_in_front import shuffle_without_catch_in_front

dirname = get_dirname(__file__)

TRIAL_NUM_COLUMN = "trial_num"
NUM_LEADING_NON_CATCH_TRIALS = 5
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
        self.safe_join_batch_num = create_safe_join_paths_fn_env("batch_num")

    def trials(
        self, worker_id: str = None, reset: bool = False, new_batch=False, max_batch_num=None
    ):
        # If worker_id not provided, generate a random username with the seconds
        # # since the epoch appended at the end.
        if worker_id is None:
            worker_id = f"{get_random_username()}_{int(time())}"
        trials_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")
        demographics_file_path = self.safe_join_paths_demographics(f"{worker_id}.csv")
        consent_file_path = self.safe_join_paths_consent(f"{worker_id}.txt")
        data_file_path = self.safe_join_paths_data(f"{worker_id}.csv")
        batch_num_file_path = self.safe_join_batch_num(f"{worker_id}.csv")

        if reset or not trials_file_path.exists():
            remove_files(
                demographics_file_path, consent_file_path, data_file_path, trials_file_path,
                batch_num_file_path
            )

            trials, trial_list = self._generate_trials(worker_id)

            curr_batch_num = 1
            write_key_value(
                batch_num_file_path, {
                    "curr_batch_num": curr_batch_num,
                    "max_batch_num": max_batch_num,
                    "completed_batches": [trial_list],
                }
            )

            total_num_trials = len(trials)

            completed_demographics = False
            consent_agreed = False
        else:
            batch_num_data = read_key_value(batch_num_file_path)
            curr_batch_num = int(batch_num_data["curr_batch_num"])
            max_batch_num = batch_num_data["max_batch_num"]
            trials, total_num_trials = get_remaining_trials_with_trial_nums(
                trials_file_path,
                data_file_path,
                trial_num_column_name=TRIAL_NUM_COLUMN,
            )

            if len(trials) == 0 and new_batch:
                trials, trial_list = self._generate_trials(worker_id, total_num_trials)
                total_num_trials += len(trials)
                append_to_csv(trials_file_path, trials)

                curr_batch_num += 1
                logger.info("curr_batch_num: %s", curr_batch_num)
                write_key_value(
                    batch_num_file_path,
                    {
                        "curr_batch_num":
                        curr_batch_num,
                        "max_batch_num":
                        max_batch_num,
                        "completed_batches":
                        parse_str_list(batch_num_data["completed_batches"]) + [trial_list],
                    },
                )

            # Parse the CSV strings into their proper data type
            for trial in trials:
                trial[TRIAL_NUM_COLUMN] = int(trial[TRIAL_NUM_COLUMN])

            completed_demographics = demographics_file_path.exists()
            consent_agreed = consent_file_path.exists()

        return {
            "trials": trials,
            "num_trials": total_num_trials,
            "completed_demographics": completed_demographics,
            "consent_agreed": consent_agreed,
            "worker_id": worker_id,
            "max_batch_num": max_batch_num,
            "curr_batch_num": curr_batch_num,
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

    def has_batches_remaining(self, worker_id: str):
        batch_num_file_path = self.safe_join_batch_num(f"{worker_id}.csv")
        if batch_num_file_path.exists():
            batch_num_data = read_key_value(batch_num_file_path)
            completed_batches = set(parse_str_list(batch_num_data["completed_batches"]))
            batch_names = set(get_fieldnames(self.counts_file_path))
            return any(
                batch_name is not None for batch_name in batch_names
                if batch_name not in completed_batches
            )
        return False

    ########################################################
    # HELPERS
    ########################################################
    def _generate_trials(self, worker_id: str, curr_trial_num: int = 0, completed_batches=None):
        # Get assigned trial list
        if not self.counts_file_path.exists():
            trial_lists = [
                trial_list_path.name for trial_list_path in listdir(self.trial_lists_folder) if
                not (completed_batches is not None and trial_list_path.name in completed_batches)
            ]
            create_counts_file(self.counts_file_path, trial_lists)
        trial_list = get_next_min_key(self.counts_file_path, key_blacklist=completed_batches)

        # Copy assigned trial list to trials folder
        trial_list_path = self.trial_lists_folder / trial_list
        trial_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")
        trials = read_rows(trial_list_path, delimiter=",")
        trials = shuffle_without_catch_in_front(
            trials,
            NUM_LEADING_NON_CATCH_TRIALS,
            type_key=QUESTION_TYPE_COLUMN,
            catch_type_value=CATCH_VALUE
        )

        # Add the trial_num column to the trials
        trials = [
            {
                TRIAL_NUM_COLUMN: curr_trial_num + index + 1,
                **row
            } for index, row in enumerate(trials)
        ]
        write_to_csv(trial_file_path, trials)

        return trials, trial_list
