from __future__ import annotations
from utils.csv.write_to_csv import write_to_csv


def create_counts_file(counts_file_path: str, keys: list[str]) -> None:
    """
    Create a file to store the counts. The counts all start with 0.

    Parameters:
    counts_file_path: File path for counts file
    keys: Keys
    """
    counts = {key: 0 for key in keys}
    write_to_csv(counts_file_path, counts)
