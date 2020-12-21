from pathlib import Path
from utils.listdir import listdir


def test_listdir(tmp_path: Path):
    test_folder_path = tmp_path / "test_folder"
    test_folder_path.mkdir()
    test_file_path = tmp_path / "test_file.csv"
    test_file_path.touch()
    ds_store_file_path = tmp_path / ".DS_Store"
    ds_store_file_path.touch()

    assert sorted(listdir(tmp_path)) == [test_file_path, test_folder_path]
