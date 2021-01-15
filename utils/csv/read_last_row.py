from __future__ import annotations
import csv


def read_last_row(file_path: str, delimiter: str = ',') -> dict[str, str]:
    """
    Read and return last row of CSV file.

    Parameters:
    file_path: File path
    delimiter: Delimiter (i.e. "," "|" "\t")

    Returns:
    Last row
    """
    with open(file_path, 'r') as f:
        r = csv.DictReader(f, delimiter=delimiter)
        return list(r)[-1]
