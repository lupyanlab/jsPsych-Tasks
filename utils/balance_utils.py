import random
import copy
from utils.csv_utils import *


def create_counts_file(counts_file_path, keys):
  counts = {key: 0 for key in keys}
  write_to_csv(counts_file_path, counts)


def increment_counts(counts, num_keys_to_increment):
  counts = copy.deepcopy(counts)
  keys_by_count = {}
  for key, count in counts.iteritems():
    keys_by_count[count] = keys_by_count.get(count, []) + [key]

  for count in keys_by_count:
    random.shuffle(keys_by_count[count])

  final_keys = []
  curr_count = None
  for i in range(num_keys_to_increment):
    if curr_count is None or len(keys_by_count[curr_count]) == 0:
      if curr_count is not None:
        del keys_by_count[curr_count]
      curr_count = min(keys_by_count.keys())
    key = keys_by_count[curr_count].pop(0)
    final_keys.append(key)
    counts[key] += 1
    keys_by_count[curr_count + 1] = keys_by_count.get(curr_count + 1, []) + [key]

  return counts, final_keys


def get_next_min_keys(update_file_lock, counts_file_path, keys, num_keys, write=True):
  '''
    Get the next num_keys of a keys with lowest counts.

    Parameters:
    update_file_lock (Lock): Lock for avoiding multiple reads/writes at same time
    counts_file_path (str): File path for counts file
    keys (List[str]): Keys
    num_keys (int): Number of keys to get

    Returns:
    List[str]: List of result next keys of length num_keys
  '''
  with update_file_lock:
    if not os.path.isfile(counts_file_path):
      create_counts_file(counts_file_path, keys)

    last_row = read_last_row(counts_file_path)
    counts = {image: int(count) for image, count in last_row.iteritems()}
    counts, final_keys = increment_counts(counts, num_keys)

    if write:
      append_to_csv(counts_file_path, counts)

    return final_keys


def get_next_min_key(update_file_lock, counts_file_path, keys, write=True):
  '''
    Get the next key with the lowest count.

    Parameters:
    update_file_lock (Lock): Lock for avoiding multiple reads/writes at same time
    counts_file_path (str): File path for counts file
    keys (List[str]): Keys

    Returns:
    str: Lowest count key
  '''
  return get_next_min_keys(update_file_lock, counts_file_path, keys, 1, write)[0]


def increment_key_count(update_file_lock, counts_file_path, key):
  '''
    Increment key count in key counts file. The key counts file must already be created!

    Parameters:
    update_file_lock (Lock): Lock for avoiding multiple reads/writes at same time
    counts_file_path (str): File path for counts file
    keys (str): Key to increment
  '''
  with update_file_lock:
    last_row = read_last_row(counts_file_path)
    counts = {row_key: int(count) for row_key, count in last_row.iteritems()}
    counts[key] += 1

    append_to_csv(counts_file_path, counts)
