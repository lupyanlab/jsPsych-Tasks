from __future__ import annotations

from typing import Union, Any, Hashable
import csv
import os
from pathlib import Path
from task_runner.logger import logger


def append_to_csv(
    file_path: str,
    rows: Union[dict[Hashable, Any], list[dict[Hashable, Any]]],
    order: list[Hashable] = None
) -> None:
    """
    Appends row to file and write headers if file or headers not exist.

    Parameters:
    file_path: File path
    row: Row(s) to append (also accepts a single row dict not in a list)
    order: (Not needed because insertion order is maintained from the browser
            and in python.) Order in which the columns must be written in 
            (must include all the columns)
    """
    if isinstance(rows, dict):
        rows = [rows]

    if len(rows) > 0:
        fields = rows[0].keys()

        if order is not None:
            if len(order) != len(rows[0].keys()
                                 ) or len(set(order) & set(fields)) != len(set(order)):
                raise Exception(
                    "order is not the same as the fields in the rows. "
                    f"order: {order}, fields: {fields}"
                )
            fields = order

        should_write_headers = not os.path.exists(file_path)

        Path(file_path).touch()

        with open(file_path, 'r+') as f:
            if should_write_headers:
                w = csv.DictWriter(f, fields)
                w.writeheader()
            else:
                reader = csv.DictReader(f)
                actual_fields = reader.fieldnames
                # Do a check on whether the fields passed and exist match
                if fields != actual_fields:
                    logger.warning(
                        "Fields in file do not match what is being appended. "
                        "fields: %s, actual_fields: %s", fields, actual_fields
                    )
                w = csv.DictWriter(f, actual_fields)

            for row in rows:
                w.writerow(row)
