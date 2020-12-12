from pathlib import Path
from utils.balance_utils.get_next_min_keys import get_next_min_keys


def test_get_next_min_keys(tmp_path: Path):
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
    CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_keys(str(file_path), 2)

    assert EXPECTED_CONTENT == file_path.read_text()


def test_get_next_min_keys_exceed_num_fields_limit(tmp_path: Path):
    CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
"""
    EXPECTED_CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    get_next_min_keys(str(file_path), 5)

    assert EXPECTED_CONTENT == file_path.read_text()
