from __future__ import annotations
from random import shuffle


class InsufficientNumNonCatchTrialsError(Exception):
    """
    Error for when there are not enough non catch trials to lead with.

    Parameters:
    actual_num_non_catch_trials: Actual number of non-catch trials
    expected_num_non_catch_trials: Expected number of non-catch trials
    """
    actual_num_non_catch_trials: int
    expected_num_non_catch_trials: int

    def __init__(self, actual_num_non_catch_trials: int, expected_num_non_catch_trials: int):
        self.actual_num_non_catch_trials = actual_num_non_catch_trials
        self.expected_num_non_catch_trials = expected_num_non_catch_trials

        super().__init__(
            "There is not enough non-catch trials to shuffle. "
            f"Found {actual_num_non_catch_trials}. Expected {expected_num_non_catch_trials}."
        )


class MissingQuestionTypeColumnError(Exception):
    """
    Error for when the question type column is missing

    Parameters:
    expected_column_name: Expected question type column name
    """
    expected_column_name: str

    def __init__(self, expected_column_name: str = None):
        self.expected_column_name = expected_column_name
        super().__init__(
            "Missing the question type column. "
            f"Expected '{expected_column_name}' column."
        )


def shuffle_without_catch_in_front(
    trials: list[dict],
    num_leading_non_catch_trials: int,
    type_key="question_type",
    catch_type_value="catch"
) -> list[dict]:
    """
    Shuffles the trial so that the first n number of trials are guaranteed not catch trials.

    Parameters:
    trials: Unshuffled trials
    num_leading_non_catch_trials: How many leading trials that should not have catch trials
    type_key: The key/column that specifies the whether the trial is a catch trial.
    catch_type_value: The value of the type key/column that specefies the trial is a catch trial.

    Returns:
    SHuffled trials with the required catch trials positions
    """
    try:
        non_catch_trials = [trial for trial in trials if trial[type_key] != catch_type_value]
    except KeyError as e:
        raise MissingQuestionTypeColumnError(type_key) from e
    if len(non_catch_trials) < num_leading_non_catch_trials:
        raise InsufficientNumNonCatchTrialsError(
            len(non_catch_trials), num_leading_non_catch_trials
        )
    shuffle(non_catch_trials)

    catch_trials = [trial for trial in trials if trial[type_key] == catch_type_value]
    leading_trials = non_catch_trials[:num_leading_non_catch_trials]
    trailing_trials = non_catch_trials[num_leading_non_catch_trials:] + catch_trials
    shuffle(trailing_trials)

    res_trials = leading_trials + trailing_trials

    return res_trials
