from __future__ import annotations
from typing import Union, Any, Hashable
import csv


def write_to_csv(
    file_path: str,
    rows: Union[list[dict[Hashable, Any]], dict[Hashable, Any]],
    order: list[Hashable] = None
) -> None:
    """
    Writes rows to file. This will overwrite existing data!

    Parameters:
    file_path (str): File path
    row: Row(s) to write (also accepts a single row dict not in a list)
    """
    if isinstance(rows, dict):
        rows = [rows]

    if len(rows) > 0:
        with open(file_path, 'wb') as f:
            w = csv.DictWriter(f, order if order else sorted(rows[0].keys()))
            w.writeheader()
            for row in rows:
                w.writerow(row)
