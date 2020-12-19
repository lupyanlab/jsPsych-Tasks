# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['test_trials 1'] = {
    'completed_demographics': False,
    'consent_agreed': False,
    'num_trials': 3,
    'trials': [
        {
            'anchor_neg': 'ugly',
            'anchor_pos': 'beautiful',
            'question_type': 'real',
            'stim': 'dog',
            'trial_num': 1
        },
        {
            'anchor_neg': '壞',
            'anchor_pos': '好',
            'question_type': 'real',
            'stim': '狗',
            'trial_num': 2
        },
        {
            'anchor_neg': 'small',
            'anchor_pos': 'large',
            'question_type': 'catch',
            'stim': 'dog',
            'trial_num': 3
        }
    ],
    'worker_id': 'test_worker_pytest'
}

snapshots['test_trials 2'] = '''trial_num,stim,anchor_neg,anchor_pos,question_type
1,dog,ugly,beautiful,real
2,狗,壞,好,real
3,dog,small,large,catch
'''

snapshots['test_trials 3'] = '''trial_list_1.csv,trial_list_3.csv,trial_list_2.csv
0,0,0
1,0,0
'''
