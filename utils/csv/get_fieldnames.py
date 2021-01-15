from __future__ import annotations

import csv


def get_fieldnames(file_path: str) -> list[str]:
    """
    Returns the field names of a CSV file.

    Parameters:
    file_path: File path

    Returns:
    List of the field names ordered from left to right.
    """
    with open(file_path, 'r') as t:
        reader = csv.DictReader(t)
        return reader.fieldnames
