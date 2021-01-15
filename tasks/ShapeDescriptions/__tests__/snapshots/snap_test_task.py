# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['test_trials 1'] = {
    'completed_demographics': False,
    'consent_agreed': False,
    'num_trials': 2,
    'trials': [
        {
            'A': 'These shapes are pointing up and to the left.',
            'B': 'These shapes are pointing to the right.',
            'label_cond': '0',
            'left': 'A',
            'ppt_ID': 'A2SY0XL28MLUTW',
            'right': 'B',
            'stimuli': [
                'B_17.png',
                'A_28.png',
                'A_18.png',
                'A_7.png',
                'B_1.png',
                'A_9.png',
                'B_23.png',
                'B_24.png',
                'B_3.png',
                'A_26.png',
                'B_12.png',
                'A_27.png',
                'A_22.png',
                'B_21.png',
                'B_19.png',
                'A_1.png',
                'B_15.png',
                'A_25.png',
                'B_6.png',
                'A_19.png'
            ],
            'trial_num': 1
        },
        {
            'A': 'These shapes tend to be "fluffier" and have a few sharp, narrow sections and points to them.',
            'B': 'These shapes tend to have many narrow sections as well as sharp points and angles. They also tend to be skinnier and have less area.',
            'label_cond': '1',
            'left': 'B',
            'ppt_ID': 'A2WVCXVSE0YGML',
            'right': 'A',
            'stimuli': [
                'B_17.png',
                'A_28.png',
                'A_18.png',
                'A_7.png',
                'B_1.png',
                'A_9.png',
                'B_23.png',
                'B_24.png',
                'B_3.png',
                'A_26.png',
                'B_12.png',
                'A_27.png',
                'A_22.png',
                'B_21.png',
                'B_19.png',
                'A_1.png',
                'B_15.png',
                'A_25.png',
                'B_6.png',
                'A_19.png'
            ],
            'trial_num': 2
        }
    ],
    'worker_id': 'test_worker_pytest'
}

snapshots['test_trials 2'] = '''trial_num,ppt_ID,label_cond,A,B,left,right,stimuli
1,A2SY0XL28MLUTW,0,These shapes are pointing up and to the left.,These shapes are pointing to the right.,A,B,"[\'B_17.png\', \'A_28.png\', \'A_18.png\', \'A_7.png\', \'B_1.png\', \'A_9.png\', \'B_23.png\', \'B_24.png\', \'B_3.png\', \'A_26.png\', \'B_12.png\', \'A_27.png\', \'A_22.png\', \'B_21.png\', \'B_19.png\', \'A_1.png\', \'B_15.png\', \'A_25.png\', \'B_6.png\', \'A_19.png\']"
2,A2WVCXVSE0YGML,1,"These shapes tend to be ""fluffier"" and have a few sharp, narrow sections and points to them.",These shapes tend to have many narrow sections as well as sharp points and angles. They also tend to be skinnier and have less area.,B,A,"[\'B_17.png\', \'A_28.png\', \'A_18.png\', \'A_7.png\', \'B_1.png\', \'A_9.png\', \'B_23.png\', \'B_24.png\', \'B_3.png\', \'A_26.png\', \'B_12.png\', \'A_27.png\', \'A_22.png\', \'B_21.png\', \'B_19.png\', \'A_1.png\', \'B_15.png\', \'A_25.png\', \'B_6.png\', \'A_19.png\']"
'''

snapshots['test_trials 3'] = {
    'completed_demographics': False,
    'consent_agreed': False,
    'num_trials': 2,
    'trials': [
        {
            'A': 'These shapes are pointing up and to the left.',
            'B': 'These shapes are pointing to the right.',
            'label_cond': '0',
            'left': 'A',
            'ppt_ID': 'A2SY0XL28MLUTW',
            'right': 'B',
            'stimuli': [
                'B_17.png',
                'A_28.png',
                'A_18.png',
                'A_7.png',
                'B_1.png',
                'A_9.png',
                'B_23.png',
                'B_24.png',
                'B_3.png',
                'A_26.png',
                'B_12.png',
                'A_27.png',
                'A_22.png',
                'B_21.png',
                'B_19.png',
                'A_1.png',
                'B_15.png',
                'A_25.png',
                'B_6.png',
                'A_19.png'
            ],
            'trial_num': 1
        },
        {
            'A': 'These shapes tend to be "fluffier" and have a few sharp, narrow sections and points to them.',
            'B': 'These shapes tend to have many narrow sections as well as sharp points and angles. They also tend to be skinnier and have less area.',
            'label_cond': '1',
            'left': 'B',
            'ppt_ID': 'A2WVCXVSE0YGML',
            'right': 'A',
            'stimuli': [
                'B_17.png',
                'A_28.png',
                'A_18.png',
                'A_7.png',
                'B_1.png',
                'A_9.png',
                'B_23.png',
                'B_24.png',
                'B_3.png',
                'A_26.png',
                'B_12.png',
                'A_27.png',
                'A_22.png',
                'B_21.png',
                'B_19.png',
                'A_1.png',
                'B_15.png',
                'A_25.png',
                'B_6.png',
                'A_19.png'
            ],
            'trial_num': 2
        }
    ],
    'worker_id': 'test_worker_pytest'
}
