import random
import pytest
from utils.shuffle_without_catch_in_front import (
    shuffle_without_catch_in_front,
    InsufficientNumNonCatchTrialsError,
    MissingQuestionTypeColumnError,
)


def test_shuffle_without_catch_in_front():
    random.seed(2)

    assert [
        {
            "question_type": "real",
        }, {
            "question_type": "real",
        }, {
            "question_type": "real",
        }, {
            "question_type": "real",
        }, {
            "question_type": "catch",
        }, {
            "question_type": "catch",
        }, {
            "question_type": "real",
        }
    ] == shuffle_without_catch_in_front(
        [
            {
                "question_type": "catch",
            }, {
                "question_type": "real",
            }, {
                "question_type": "real",
            }, {
                "question_type": "real",
            }, {
                "question_type": "real",
            }, {
                "question_type": "real",
            }, {
                "question_type": "catch",
            }
        ],
        4,
    )


def test_shuffle_without_catch_in_front_with_type_key_value():
    random.seed(1)

    assert [
        {
            "q_type": "r",
        }, {
            "q_type": "r",
        }, {
            "q_type": "r",
        }, {
            "q_type": "r",
        }, {
            "q_type": "r",
        }, {
            "q_type": "c",
        }, {
            "q_type": "c",
        }
    ] == shuffle_without_catch_in_front(
        [
            {
                "q_type": "c",
            }, {
                "q_type": "r",
            }, {
                "q_type": "r",
            }, {
                "q_type": "r",
            }, {
                "q_type": "r",
            }, {
                "q_type": "r",
            }, {
                "q_type": "c",
            }
        ],
        4,
        type_key="q_type",
        catch_type_value="c"
    )


def test_shuffle_without_catch_in_front_insufficient_num_non_catch_trials():
    random.seed(1)

    with pytest.raises(InsufficientNumNonCatchTrialsError) as exc:
        shuffle_without_catch_in_front(
            [
                {
                    "q_type": "c",
                }, {
                    "q_type": "r",
                }, {
                    "q_type": "r",
                }, {
                    "q_type": "c",
                }, {
                    "q_type": "c",
                }, {
                    "q_type": "c",
                }, {
                    "q_type": "c",
                }
            ],
            4,
            type_key="q_type",
            catch_type_value="c"
        )
    assert exc.value.actual_num_non_catch_trials == 2
    assert exc.value.expected_num_non_catch_trials == 4


def test_shuffle_without_catch_in_front_missing_question_type_column():
    random.seed(1)

    with pytest.raises(MissingQuestionTypeColumnError) as exc:
        shuffle_without_catch_in_front(
            [
                {
                    "q_type": "c",
                }, {
                    "q_type": "r",
                }, {
                    "missing": "r",
                }, {
                    "q_type": "c",
                }, {
                    "q_type": "c",
                }, {
                    "q_type": "c",
                }, {
                    "q_type": "c",
                }
            ],
            4,
            type_key="q_type",
            catch_type_value="c"
        )
    assert exc.value.expected_column_name == "q_type"
