from random import seed

import pytest

from utils.balance_utils.increment_counts import increment_counts


def test_increment_counts():
    seed(0)
    assert increment_counts({'image1': 0, 'image2': 1}, 1)[0] == {'image1': 1, 'image2': 1}
    assert increment_counts({'image1': 0, 'image2': 1}, 1)[1] == ['image1']

    # image1 should not show up twice
    assert increment_counts({
        'image1': 0,
        'image2': 1,
        'image3': 1
    }, 3) == ({
        'image1': 1,
        'image2': 2,
        'image3': 2
    }, ['image1', 'image2', 'image3'])


def test_increment_counts_key_blacklist():
    seed(0)

    assert increment_counts({
        'image1': 0,
        'image2': 1,
        'image3': 1
    }, 3, key_blacklist=[
        "image1"
    ]) == ({
        'image1': 0,
        'image2': 3,
        'image3': 2
    }, ['image2', 'image3', 'image2'])


def test_increment_counts_all_key_blacklist():
    seed(0)

    with pytest.raises(Exception) as exc:
        increment_counts(
            {
                'image1': 0,
                'image2': 1,
                'image3': 1
            },
            3,
            key_blacklist=["image1", "image2", "image3"]
        )

    assert exc.value.args[0] == "No valid keys to increment"
