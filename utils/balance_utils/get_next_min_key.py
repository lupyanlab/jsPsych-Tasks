from __future__ import annotations

from pathlib import Path
from typing import Hashable, Union

from utils.balance_utils.get_next_min_keys import get_next_min_keys


def get_next_min_key(
    counts_file_path: Union[Path, str], write=True, key_blacklist: set[Hashable] = None
) -> str:
    """
    Get the next key with the lowest count.

    When a key blacklist is included, these keys will be skipped when picking
    keys to increment.
    
    Parameters:
    counts_file_path: File path for counts file
    keys: Keys
    key_blacklist: Keys to exclude from incrementing

    Returns:
    Lowest count key
    """

    keys = get_next_min_keys(counts_file_path, 1, write, key_blacklist=key_blacklist)
    if len(keys) == 0:
        raise Exception("No keys were found in the counts file.")

    return keys[0]
