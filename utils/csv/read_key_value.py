from __future__ import annotations

import csv


def read_key_value(file_path: str) -> dict[str, str]:
    """
    Read a csv file with a key and value column
    and parse each row into a single item in a dict.

    key,value
    k1,v1
    k2,v2

    { "k1": "v1", "k2": "v2" }

    Parameters:
    file_path (str): File path

    Returns:
    Dictionary containing an item per csv key value row.
    """
    d = {}
    with open(file_path, 'r') as t:
        rows = csv.DictReader(t)
        for row in rows:
            d[row['key']] = row['value']

    return d
