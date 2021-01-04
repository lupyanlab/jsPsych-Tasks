import random
from pathlib import Path
from utils.balance_utils.get_next_min_keys import get_next_min_keys


def test_get_next_min_keys(tmp_path: Path):
    random.seed(1)

    CONTENT = """image1,image2,image3,image4
3,3,2,2
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_keys(str(file_path), 2)

    assert EXPECTED_CONTENT == file_path.read_text()


def test_get_next_min_keys_roll_over(tmp_path: Path):
    random.seed(1)

    CONTENT = """image1,image2,image3,image4
3,3,2,2
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,2,2
3,4,3,3
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_keys(str(file_path), 3)

    assert EXPECTED_CONTENT == file_path.read_text()


def test_get_next_min_keys_roll_over_no_overlap(tmp_path: Path):
    random.seed(1)

    CONTENT = """image1,image2,image3,image4
3,3,2,2
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,2,2
4,4,3,3
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_keys(str(file_path), 4)

    assert EXPECTED_CONTENT == file_path.read_text()


def test_get_next_min_keys_exceed_num_fields_limit(tmp_path: Path):
    random.seed(1)

    CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
4,4,4,5
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_keys(str(file_path), 5)

    assert EXPECTED_CONTENT == file_path.read_text()


def test_get_next_min_keys_key_blacklist(tmp_path: Path):
    random.seed(1)

    CONTENT = """image1,image2,image3,image4
3,3,2,2
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,2,2
4,4,3,2
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_keys(str(file_path), 3, key_blacklist=["image4"])

    assert EXPECTED_CONTENT == file_path.read_text()
