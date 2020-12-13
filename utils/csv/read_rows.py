from __future__ import annotations
import csv


def read_rows(file_path: str, delimiter: str = ',') -> list[dict[str, str]]:
    """
    Read and return all rows of CSV file.

    Parameters:
    file_path (str): File path
    delimiter: Delimiter (i.e. "," "|" "\t")

    Returns:
    Rows
    """
    with open(file_path, 'r') as f:
        rows = csv.DictReader(f, delimiter=delimiter)
        return [dict(row) for row in rows]
