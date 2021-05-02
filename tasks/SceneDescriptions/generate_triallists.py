import pandas as pd
from os import listdir
from random import shuffle

imgs = sorted(listdir('images'))
imgs = [img for img in imgs if img.endswith('.png')]
imgs = [img for img in imgs if len(img) > 16]

def generate_triallist_pairs(n=1):
    trials = {
        'image': imgs,
        'nr': [img.split('_')[0] for img in imgs],
        'plaus': [img.split('_')[1] for img in imgs]
    }
    trials = pd.DataFrame(trials)
    trials['question_type'] = ''
    trials['naming_question'] = 'Please describe what is happening in this image.'
    trials['confidence_question'] = 'How well does this description fit this image?'
    nums = trials['nr'].unique()
    for i in range(n):
        shuffle(nums)
        j = len(nums)
        k = j // 2
        selected = {
            'nr': nums,
            'plaus': ['plaus'] * k + ['implaus'] * (j - k)
        }
        selected = pd.DataFrame(selected)
        df = selected.merge(trials, how='left', on=['nr', 'plaus'])
        listnum = 2 * i + 1
        df['trial_list_num'] = listnum
        df.to_csv(f'trial_lists/trial_list_{listnum}.csv', index=False)
        selected['plaus'] = selected['plaus'].replace({'plaus': 'implaus', 'implaus': 'plaus'})
        df = selected.merge(trials, how='left', on=['nr', 'plaus'])
        listnum = 2 * i + 2
        df['trial_list_num'] = listnum
        df.to_csv(f'trial_lists/trial_list_{listnum}.csv', index=False)

generate_triallist_pairs(2)
