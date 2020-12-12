from __future__ import annotations
from utils.balance_utils.increment_counts import increment_counts
from utils.csv.read_last_row import read_last_row
from utils.csv.append_to_csv import append_to_csv


def get_next_min_keys(counts_file_path: str, num_keys: int, write: bool = True) -> list[str]:
    """
    Get the next num_keys of a keys with lowest counts.

    Parameters:
    counts_file_path: File path for counts file
    num_keys: Number of keys to get
    write: Write the resulting min keys to the file if True

    Returns:
    List of result next keys of length num_keys
    """
    last_row = read_last_row(counts_file_path)
    counts = {key: int(count) for key, count in last_row.items()}
    counts, final_keys = increment_counts(counts, num_keys)

    if write:
        append_to_csv(counts_file_path, counts)

    return final_keys
