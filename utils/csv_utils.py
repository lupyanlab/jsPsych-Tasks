import csv
import os


def append_to_csv(file_path, row):
  '''
    Appends row to file.

    Parameters:
    file_path (str): File path
    row (Dict): Row to append
  '''
  write_headers = not os.path.exists(file_path)

  with open(file_path, 'a') as f:
    w = csv.DictWriter(f, sorted(row.keys()))
    if write_headers:
      w.writeheader()
    w.writerow(row)


def write_to_csv(file_path, rows):
  '''
    Writes rows to file. This will overwrite existing data!

    Parameters:
    file_path (str): File path
    rows (List[dict]): Row to write
  '''
  if type(rows) == dict:
    rows = [rows]
  if len(rows) > 0:
    with open(file_path, 'wb') as f:
      w = csv.DictWriter(f, sorted(rows[0].keys()))
      w.writeheader()
      for row in rows:
        w.writerow(row)


def remove_files(*file_paths):
  '''
    Remove files if they exist.

    Parameters:
    *file_paths (List[str]): File paths with files to delete
  '''
  for file_path in file_paths:
    if os.path.exists(file_path):
      os.remove(file_path)


def read_last_row(file_path):
  '''
    Read and return last row of CSV file.

    Parameters:
    file_path (str): File path

    Returns:
    dict: Last row
  '''
  with open(file_path, 'rb') as f:
    r = csv.DictReader(f)
    return {image: int(count) for image, count in list(r)[-1].iteritems()}


def read_rows(file_path):
  '''
    Read and return all rows of CSV file.

    Parameters:
    file_path (str): File path

    Returns:
    List[dict]: Rows
  '''
  with open(file_path, 'rb') as t:
    rows = csv.DictReader(t)
    return list(rows)
