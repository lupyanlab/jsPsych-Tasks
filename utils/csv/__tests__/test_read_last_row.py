from pathlib import Path
from utils.csv.read_last_row import read_last_row


def test_read_last_row(tmp_path: Path):
    CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
4,3,4,3
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    assert {
        "image1": "4",
        "image2": "3",
        "image3": "4",
        "image4": "3",
    } == read_last_row(str(file_path))
