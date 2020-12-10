from __future__ import annotations
from threading import RLock
from utils.csv.write_to_csv import write_to_csv


def create_counts_file(lock: RLock, counts_file_path: str, keys: list[str]) -> None:
    """
    Create a file to store the counts. The counts all start with 0.

    Parameters:
    lock: Lock for avoiding multiple reads/writes at same time
    counts_file_path: File path for counts file
    keys: Keys
    """
    with lock:
        counts = {key: 0 for key in keys}
        write_to_csv(counts_file_path, counts)
