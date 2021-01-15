from __future__ import annotations
from typing import Hashable
from pathlib import Path
from utils.csv.read_rows import read_rows


def get_remaining_trials(
    trials_file_path: Path,
    data_file_path: Path,
    trial_key_fn: callable[[dict], Hashable] = None,
    data_key_fn: callable[[dict], Hashable] = None
) -> tuple[list[dict[str, str]], int]:
    """
    Gets the remaining trials by reading the trials file and comparing with whatever is already
    recorded in the data file. The key functions trnaslates what is recorded in trial and data
    file rows into a normalized key where they can be compared against
    and omit trials that do have a corresponding key from the data recorded.

    The trial_key_fn and data_key_fn are optional. And if either is omitted, the returned
    remaining trials will be the trials ordered in the file after number of rows in the data
    file. This assumes that row number of each data row correpsonds exactly to the same row number
    of the trials file. This is the case for many of the tasks; however, creating actual key
    functions help prevent possible duplicated records. If the data file ensures that there
    are no duplicates (i.e. no same trial number is recorded more than once), omitting
    the key functions is totally fine.

    Parameters:
    trials_file_path: Path to trials file
    data_file_path: Path to data file
    trial_key_fn: Function to translate a trial row to a normalized hashable key
    data_key_fn: Function to translate a data row to a normalized hashable key

    Returns:
    Tuple of the remaining trials (ordered as is from the trials file) and the total number
    of trials.
    """

    trials = read_rows(trials_file_path) if trials_file_path.exists() else []
    if len(trials) == 0:
        return trials, len(trials)

    data = read_rows(data_file_path) if data_file_path.exists() else []
    if len(data) == 0:
        return trials, len(trials)

    if trial_key_fn is not None and data_key_fn is not None:
        existing_keys = set(data_key_fn(data_record) for data_record in data)
        remaining_trials = [trial for trial in trials if trial_key_fn(trial) not in existing_keys]
    else:
        remaining_trials = trials[len(data):]

    return remaining_trials, len(trials)


def get_remaining_trials_with_trial_nums(
    trials_file_path: Path,
    data_file_path: Path,
    trial_num_column_name: str = "trial_num",
) -> tuple[list[dict[str, str]], int]:
    """
    Helper function for get_remaining_trials where the key is just the trial number
    for both the trial and data files.

    Parameters:
    trials_file_path: Path to trials file
    data_file_path: Path to data file
    trial_num_column_name: The trial number column name

    Returns:
    Tuple of the remaining trials (ordered as is from the trials file) and the total number
    of trials.
    """
    return get_remaining_trials(
        trials_file_path,
        data_file_path,
        trial_key_fn=lambda trial: trial[trial_num_column_name],
        data_key_fn=lambda data: data[trial_num_column_name],
    )
