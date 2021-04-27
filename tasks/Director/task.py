from __future__ import annotations

from os import mkdir
from random import choice, sample, shuffle
from time import time
from utils.csv.parse_str_list import parse_str_list
from collections import defaultdict

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
# NUM_LEADING_NON_CATCH_TRIALS = 2  # Note: There are no catch trials here
# QUESTION_TYPE_COLUMN = "question_type"
# CATCH_VALUE = "catch"


class Task:
    def __init__(self, dev=False):
        env_folder_path = dirname / ("dev" if dev else "prod")

        # This is for different environments that can be set in Pytest
        if ENV_FOLDER_PATH_KEY in app.config:
            env_folder_path = app.config[ENV_FOLDER_PATH_KEY]

        if not env_folder_path.exists():
            mkdir(env_folder_path)

        self.trial_lists_folder_path = dirname / "trial_lists"

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
                trial[TRIAL_NUM_COLUMN] = int(trial[TRIAL_NUM_COLUMN])
                trial["target1_order"] = int(trial["target1_order"])
                trial["target2_order"] = int(trial["target2_order"])
                trial["target3_order"] = int(trial["target3_order"])
                trial["distractor1_order"] = int(trial["distractor1_order"])
                trial["distractor2_order"] = int(trial["distractor2_order"])
                trial["distractor3_order"] = int(trial["distractor3_order"])
                trial["distractor4_order"] = int(trial["distractor4_order"])
                trial["distractor5_order"] = int(trial["distractor5_order"])
                trial["distractor6_order"] = int(trial["distractor6_order"])

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
            trial_lists = [
                trial_list_path.name for trial_list_path in listdir(self.trial_lists_folder_path)
            ]
            create_counts_file(self.counts_file_path, trial_lists)
        trial_list = get_next_min_key(self.counts_file_path)

        # Copy assigned trial list to trials folder
        trial_list_path = self.trial_lists_folder_path / trial_list
        trial_file_path = self.safe_join_paths_trials(f"{worker_id}.csv")
        trials = read_rows(trial_list_path)
        trials = randomize_trials(trials)

        new_trials = []
        for index, row in enumerate(trials):
            order = list(range(1, 10))
            shuffle(order)
            new_trials.append(
                {
                    **row,
                    TRIAL_NUM_COLUMN: index + 1,
                    "target1_order": order[0],
                    "target2_order": order[1],
                    "target3_order": order[2],
                    "distractor1_order": order[3],
                    "distractor2_order": order[4],
                    "distractor3_order": order[5],
                    "distractor4_order": order[6],
                    "distractor5_order": order[7],
                    "distractor6_order": order[8],
                }
            )
        trials = new_trials

        write_to_csv(trial_file_path, trials)

        return trials


def randomize_trials(trials: list[dict]) -> list[dict]:
    """
    Randomize trials with the constraint that no two trials with the same
    implicit_term are consecutive.
    Pop a random trial where the current trial isn't the same implicit_term
    as the one that isn't popped.
    """
    randomized_trials = []
    if len(trials) > 0:
        trials = trials[:]
        shuffle(trials)
        trials_by_implicit_term = defaultdict(list)
        for trial in trials:
            trials_by_implicit_term[trial['implicit_term']].append(trial)

        curr_implicit_term = None
        # Randomize all but last trial which will require special handling.
        for _ in range(len(trials) - 1):
            curr_implicit_term = choice(
                [
                    implicit_term for implicit_term in trials_by_implicit_term.keys()
                    if implicit_term != curr_implicit_term
                ]
            )
            randomized_trials.append(trials_by_implicit_term[curr_implicit_term].pop())
            if len(trials_by_implicit_term[curr_implicit_term]) == 0:
                del trials_by_implicit_term[curr_implicit_term]

        # Handle last trial
        if len(trials_by_implicit_term.values()) > 0:
            # Because there are a max of 2 trials per implicit_term, arrange the last trial
            # to be the first if the implict_term is the same as the last one. If not,
            # simply add to the end.
            last_trial = list(trials_by_implicit_term.values())[0][0]
            if last_trial['implicit_term'] == curr_implicit_term:
                randomized_trials.insert(0, last_trial)
            else:
                randomized_trials.append(last_trial)

    return randomized_trials