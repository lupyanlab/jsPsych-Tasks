from pathlib import Path
from typing import Union
from utils.balance_utils.get_next_min_keys import get_next_min_keys


def get_next_min_key(counts_file_path: Union[Path, str], write=True) -> str:
    """
    Get the next key with the lowest count.

    Parameters:
    counts_file_path: File path for counts file
    keys: Keys

    Returns:
    Lowest count key
    """

    keys = get_next_min_keys(counts_file_path, 1, write)
    if len(keys) == 0:
        raise Exception("No keys were found in the counts file.")

    return keys[0]
