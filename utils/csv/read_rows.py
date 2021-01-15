from __future__ import annotations
import csv
from typing import Union
from pathlib import Path


def read_rows(file_path: Union[str, Path], delimiter: str = ',') -> list[dict[str, str]]:
    """
    Read and return all rows of CSV file.

    Parameters:
    file_path: File path
    delimiter: Delimiter (i.e. "," "|" "\t")

    Returns:
    Rows
    """
    with open(file_path, 'r') as f:
        rows = csv.DictReader(f, delimiter=delimiter)
        return [dict(row) for row in rows]
