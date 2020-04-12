import csv
import os


def append_to_csv(file_path, row):
  write_headers = not os.path.exists(file_path)

  with open(file_path, 'a') as f:
    w = csv.DictWriter(f, sorted(row.keys()))
    if write_headers:
      w.writeheader()
    w.writerow(row)


def write_to_csv(file_path, rows):
  if type(rows) == dict:
    rows = [rows]
  if len(rows) > 0:
    with open(file_path, 'wb') as f:
      w = csv.DictWriter(f, sorted(rows[0].keys()))
      w.writeheader()
      for row in rows:
        w.writerow(row)


def remove_files(*file_paths):
  for file_path in file_paths:
    if os.path.exists(file_path):
      os.remove(file_path)


def read_last_row(file_path):
  with open(file_path, 'rb') as f:
    r = csv.DictReader(f)
    return {image: int(count) for image, count in list(r)[-1].iteritems()}


def read_rows(file_path):
  with open(file_path, 'rb') as t:
    rows = csv.DictReader(t)
    return list(rows)
