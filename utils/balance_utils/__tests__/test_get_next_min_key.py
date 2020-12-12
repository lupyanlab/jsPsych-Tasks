from pathlib import Path
from utils.balance_utils.get_next_min_key import get_next_min_key


def test_get_next_min_key(tmp_path: Path):
    EXPECTED_CONTENT = """image1,image2
3,2,1,0
"""
    file_path = tmp_path / "test.csv"
    get_next_min_key(str(file_path), ["image1", "image2"])

    assert EXPECTED_CONTENT == file_path.read_text()
