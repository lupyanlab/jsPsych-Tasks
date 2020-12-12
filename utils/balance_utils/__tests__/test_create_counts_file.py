from pathlib import Path
from utils.balance_utils.create_counts_file import create_counts_file


def test_create_counts_file(tmp_path: Path):
    EXPECTED_CONTENT = """image1,image2
0,0
"""
    file_path = tmp_path / "test.csv"
    create_counts_file(str(file_path), ["image1", "image2"])

    assert EXPECTED_CONTENT == file_path.read_text()
