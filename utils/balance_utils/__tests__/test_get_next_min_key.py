import random
from pathlib import Path
from utils.balance_utils.get_next_min_key import get_next_min_key


def test_get_next_min_key(tmp_path: Path):
    random.seed(1)

    CONTENT = """image1,image2,image3,image4
3,3,2,2
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,2,3
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_key(str(file_path), 2)

    assert EXPECTED_CONTENT == file_path.read_text()


def test_get_next_min_key_roll_over(tmp_path: Path):
    random.seed(3)

    CONTENT = """image1,image2,image3,image4
3,3,3,3
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,3,3
3,3,3,4
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_key(str(file_path), 3)

    assert EXPECTED_CONTENT == file_path.read_text()


def test_get_next_min_key_key_blacklist(tmp_path: Path):
    random.seed(1)

    CONTENT = """image1,image2
1,0
"""
    EXPECTED_CONTENT = """image1,image2
1,0
2,0
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_key(file_path, key_blacklist=["image2"])

    assert EXPECTED_CONTENT == file_path.read_text()
