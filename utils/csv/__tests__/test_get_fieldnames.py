from pathlib import Path

from utils.csv.get_fieldnames import get_fieldnames


def test_append_to_csv_different_fields_order(tmp_path: Path):
    CONTENT = """worker,response
test123,999
"""

    file_path = tmp_path / "test.csv"
    file_path.write_text(CONTENT)

    assert ["worker", "response"] == get_fieldnames(file_path, )
