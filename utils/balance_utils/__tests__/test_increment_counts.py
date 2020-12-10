from collections import Counter

from utils.balance_utils.increment_counts import increment_counts


def test_increment_counts():
    assert increment_counts({'image1': 0, 'image2': 1}, 1)[0] == {'image1': 1, 'image2': 1}
    assert increment_counts({'image1': 0, 'image2': 1}, 1)[1] == ['image1']

    # image1 should not show up twice
    assert increment_counts({
        'image1': 0,
        'image2': 1,
        'image3': 1
    }, 3)[0] == {
        'image1': 1,
        'image2': 2,
        'image3': 2
    }
    assert Counter(increment_counts({
        'image1': 0,
        'image2': 1,
        'image3': 1
    }, 3)[1]) == Counter(['image1', 'image2', 'image3'])
