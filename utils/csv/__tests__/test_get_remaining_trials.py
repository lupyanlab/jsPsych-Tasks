from pathlib import Path
from utils.csv.get_remaining_trials import (
    get_remaining_trials, get_remaining_trials_with_trial_nums
)


def test_get_remaining_trials(tmp_path: Path):
    TRIALS_CONTENT = """worker,image
test123,scale.png
test123,frog.png
test123,bunny.png
test123,jainz.png
test123,toes.png
test123,dog.png
"""

    DATA_CONTENT = """worker,image,response
test123,scale.png,1
test123,frog.png,2
test123,bunny.png,3
test123,jainz.png,4
"""

    trials_file_path = tmp_path / "trials.csv"
    trials_file_path.write_text(TRIALS_CONTENT)
    data_file_path = tmp_path / "data.csv"
    data_file_path.write_text(DATA_CONTENT)

    assert (
        [{
            "worker": "test123",
            "image": "toes.png"
        }, {
            "worker": "test123",
            "image": "dog.png"
        }], 6
    ) == get_remaining_trials(trials_file_path, data_file_path)


def test_get_remaining_trials_key_fns(tmp_path: Path):
    TRIALS_CONTENT = """worker,image,orientation
test123,scale.png,vertical
test123,frog.png,horizontal
test123,bunny.png,vertical
test123,jainz.png,horizontal
test123,toes.png,vertical
test123,dog.png,horizontal
"""

    DATA_CONTENT = """worker,image,response,orientation
test123,scale.png,1,vertical
test123,scale.png,1,vertical
test123,scale.png,1,vertical
test123,scale.png,1,vertical
test123,frog.png,2,horizontal
test123,frog.png,2,horizontal
test123,frog.png,2,horizontal
test123,frog.png,2,horizontal
test123,bunny.png,3,vertical
test123,bunny.png,3,vertical
test123,bunny.png,3,vertical
test123,bunny.png,3,vertical
test123,jainz.png,4,horizontal
test123,jainz.png,4,horizontal
test123,jainz.png,4,horizontal
"""

    trials_file_path = tmp_path / "trials.csv"
    trials_file_path.write_text(TRIALS_CONTENT)
    data_file_path = tmp_path / "data.csv"
    data_file_path.write_text(DATA_CONTENT)

    assert (
        [
            {
                "worker": "test123",
                "image": "toes.png",
                "orientation": "vertical",
            }, {
                "worker": "test123",
                "image": "dog.png",
                "orientation": "horizontal",
            }
        ], 6
    ) == get_remaining_trials(
        trials_file_path,
        data_file_path,
        trial_key_fn=lambda trial: f"{trial['image']}-{trial['orientation']}",
        data_key_fn=lambda data: f"{data['image']}-{data['orientation']}"
    )


def test_get_remaining_trials_with_trial_num(tmp_path: Path):
    TRIALS_CONTENT = """trial_num,worker,image,orientation
1,test123,scale.png,vertical
2,test123,frog.png,horizontal
3,test123,bunny.png,vertical
4,test123,jainz.png,horizontal
5,test123,toes.png,vertical
6,test123,dog.png,horizontal
"""

    DATA_CONTENT = """trial_num,worker,image,response,orientation
1,test123,scale.png,1,vertical
1,test123,scale.png,1,vertical
1,test123,scale.png,1,vertical
1,test123,scale.png,1,vertical
2,test123,frog.png,2,horizontal
2,test123,frog.png,2,horizontal
2,test123,frog.png,2,horizontal
2,test123,frog.png,2,horizontal
3,test123,bunny.png,3,vertical
3,test123,bunny.png,3,vertical
3,test123,bunny.png,3,vertical
3,test123,bunny.png,3,vertical
4,test123,jainz.png,4,horizontal
4,test123,jainz.png,4,horizontal
4,test123,jainz.png,4,horizontal
"""

    trials_file_path = tmp_path / "trials.csv"
    trials_file_path.write_text(TRIALS_CONTENT)
    data_file_path = tmp_path / "data.csv"
    data_file_path.write_text(DATA_CONTENT)

    assert (
        [
            {
                "trial_num": "5",
                "worker": "test123",
                "image": "toes.png",
                "orientation": "vertical",
            }, {
                "trial_num": "6",
                "worker": "test123",
                "image": "dog.png",
                "orientation": "horizontal",
            }
        ], 6
    ) == get_remaining_trials_with_trial_nums(
        trials_file_path,
        data_file_path,
    )
