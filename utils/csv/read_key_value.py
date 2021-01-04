from __future__ import annotations

import csv


def read_key_value(file_path: str, empty_value_to_none=True) -> dict[str, str]:
    """
    Read a csv file with a key and value column
    and parse each row into a single item in a dict.

    key,value
    k1,v1
    k2,v2

    { "k1": "v1", "k2": "v2" }

    Parameters:
    file_path: File path
    empty_value_to_none: If true, empty string values are converted to None

    Returns:
    Dictionary containing an item per csv key value row.
    """
    d = {}
    with open(file_path, 'r') as t:
        rows = csv.DictReader(t)
        for row in rows:
            if empty_value_to_none and len(row['value']) == 0:
                d[row['key']] = None
            else:
                d[row['key']] = row['value']

    return d
