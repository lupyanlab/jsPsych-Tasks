from __future__ import annotations

import copy
import random
from collections import defaultdict
from typing import Hashable


def increment_counts(
    counts: dict[Hashable, int],
    num_keys_to_increment: int,
    key_blacklist: set[Hashable] = None
) -> tuple[dict[Hashable, int], list]:
    """
    Increments a set number of keys in a counts dictionary. The keys
    that are incremented will not be incremented twice. If num_keys_to_increment
    is greater than the number of keys, no more than the number of keys will be incremented
    (i.e. min(num_keys_to_increment, len(keys))).

    When a key blacklist is included, these keys will be skipped when picking
    keys to increment.

    Parameters:
    counts: Keys
    num_keys_to_increment: Number of keys to increment
    key_blacklist: Keys to exclude from incrementing

    Returns:
    A tuple with the after-incremented counts dictionary first and
    the list of keys that were incremented second.
    """
    if key_blacklist is None:
        key_blacklist = set()

    counts = copy.deepcopy(counts)
    keys_by_count = defaultdict(list)
    for key, count in counts.items():
        if key not in key_blacklist:
            keys_by_count[count] = keys_by_count[count] + [key]

    if len(keys_by_count) == 0:
        raise Exception("No valid keys to increment")

    for count in keys_by_count:
        random.shuffle(keys_by_count[count])

    final_keys = []
    curr_count = None
    for _ in range(num_keys_to_increment):
        if curr_count is None or len(keys_by_count[curr_count]) == 0:
            if curr_count is not None:
                del keys_by_count[curr_count]
            curr_count = min(keys_by_count.keys())
        key = keys_by_count[curr_count].pop(0)
        final_keys.append(key)
        counts[key] += 1
        keys_by_count[curr_count + 1] = keys_by_count[curr_count + 1] + [key]

    return counts, final_keys
