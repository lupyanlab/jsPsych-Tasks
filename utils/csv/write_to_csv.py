from __future__ import annotations
from typing import Union, Any, Hashable
from pathlib import Path
import csv


def write_to_csv(
    file_path: Union[str, Path],
    rows: Union[list[dict[Hashable, Any]], dict[Hashable, Any]],
    order: list[Hashable] = None
) -> None:
    """
    Writes rows to file. This will overwrite existing data!

    Parameters:
    file_path: File path
    row: Row(s) to write (also accepts a single row dict not in a list)
    order: (Not needed because insertion order is maintained from the browser
            and in python.) Order in which the columns must be written in 
            (must include all the columns)
    """
    if isinstance(rows, dict):
        rows = [rows]

    if len(rows) > 0:
        with open(file_path, 'w') as f:
            w = csv.DictWriter(f, order if order is not None else rows[0].keys())
            w.writeheader()
            for row in rows:
                w.writerow(row)
