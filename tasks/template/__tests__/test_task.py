from ..task import increment_image_counts
from collections import Counter

def test_increment_image_counts():
  assert increment_image_counts({ 'image1': 0, 'image2': 1 }, 1)[0] == { 'image1': 1, 'image2': 1 }
  assert increment_image_counts({'image1': 0, 'image2': 1}, 1)[1] == ['image1']

  # image1 should not show up twice
  assert increment_image_counts({ 'image1': 0, 'image2': 1, 'image3': 1 }, 3)[0] == { 'image1': 1, 'image2': 2, 'image3': 2 }
  assert Counter(increment_image_counts({ 'image1': 0, 'image2': 1, 'image3': 1 }, 3)[1]) == Counter(['image1', 'image2', 'image3'])
