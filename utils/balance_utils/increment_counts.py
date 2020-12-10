from __future__ import annotations
from typing import Hashable
import random
import copy


def increment_counts(counts: dict[Hashable, int],
                     num_keys_to_increment: int) -> tuple[dict[Hashable, int], list]:
    """
    Increments a set number of keys in a counts dictionary. The keys
    that are incremented will not be incremented twice. If num_keys_to_increment
    is greater than the number of keys, no more than the number of keys will be incremented
    (i.e. min(num_keys_to_increment, len(keys))).

    Parameters:
    counts: Keys
    num_keys_to_increment: Number of keys to increment

    Returns:
    A tuple with the after-incremented counts dictionary first and
    the list of keys that were incremented second.
    """
    counts = copy.deepcopy(counts)
    keys_by_count = {}
    for key, count in counts.items():
        keys_by_count[count] = keys_by_count.get(count, []) + [key]

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
        keys_by_count[curr_count + 1] = keys_by_count.get(curr_count + 1, []) + [key]

    return counts, final_keys
