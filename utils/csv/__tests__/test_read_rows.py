from pathlib import Path
from utils.csv.read_rows import read_rows


def test_read_rows(tmp_path: Path):
    CONTENT = """image1,image2,image3,image4
3,3,2,2
3,3,3,3
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    assert [
        {
            "image1": "3",
            "image2": "3",
            "image3": "2",
            "image4": "2",
        }, {
            "image1": "3",
            "image2": "3",
            "image3": "3",
            "image4": "3",
        }
    ] == read_rows(str(file_path))


def test_read_rows_empty(tmp_path: Path):
    CONTENT = """image1,image2,image3,image4
"""
    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    assert [] == read_rows(str(file_path))
