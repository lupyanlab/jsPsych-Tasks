import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import api from '../../utils/api.js';
import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';

let { workerId: worker_id, fullscreen, reset, max_batch_num } = searchParams;
max_batch_num = Number(max_batch_num);

(async () => {
  await loadJsPsychPlugins();

  let {
    trials,
    num_trials,
    completed_demographics,
    consent_agreed,
    score,
    curr_batch_num,
    batch,
  } = await api({
    fn: 'trials',
    kwargs: { worker_id, reset },
  });

  const timeline = [];

  const consent_trial = {
    type: 'lupyanlab-consent',
    url: './consent.html',
    alert:
      'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
    button_label: 'Start Experiment',
    on_finish: () => {
      api({ fn: 'consent', kwargs: { worker_id, max_batch_num } });
    },
  };

  // if (!consent_agreed) timeline.push(consent_trial);

  const continue_space = /* html */ `<div class='right small'>(press SPACE to continue)</div>`;

  const instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      /* html */ `<p class="lead">Instructions
      </p> <p class="lead">TODO</p> ${continue_space}`,
    ],
    show_clickable_nav: true,
  };
  // if (trials.length > 0) timeline.push(instructions);

  let allow_more_batches =
    (batch !== null && isNaN(max_batch_num)) || curr_batch_num < max_batch_num;
  let get_new_batch = false;
  let curr_batch_trial_index = 0;

  const batch_block = {
    timeline: [
      {
        timeline: [
          {
            type: 'lupyanlab-concept',
            // input_feedback_duration: 0,
            // reward_feedback_duration: 0,
            input_feedback_duration: 500,
            reward_feedback_duration: 1500,
            reward_html: (reward) => {
              if (reward == 0) {
                return `<span style="color:grey;">+${reward}</span>`;
              } else if (reward < 6) {
                return `<span style="color:red;">+${reward}!</span>`;
              }
              return `<span style="color:red; font-size:1.5em;">+${reward}!</span>`;
            },

            trial_progress_text: () =>
              `Trial ${Number(trials[curr_batch_trial_index].trial_number)} of ${num_trials}`,
            choices: () => [
              trials[curr_batch_trial_index].choice1,
              trials[curr_batch_trial_index].choice2,
              trials[curr_batch_trial_index].choice3,
              trials[curr_batch_trial_index].choice4,
              trials[curr_batch_trial_index].choice5,
              trials[curr_batch_trial_index].choice6,
              trials[curr_batch_trial_index].choice7,
            ],
            concept: () => trials[curr_batch_trial_index].concept,
            concept_pre: () => trials[curr_batch_trial_index].concept_pre,
            you_prompt: () => trials[curr_batch_trial_index].you_prompt,
            others_prompt: () => trials[curr_batch_trial_index].others_prompt,
            anchor_neg: () => trials[curr_batch_trial_index].anchor_neg,
            anchor_pos: () => trials[curr_batch_trial_index].anchor_pos,
            score: () => score,

            on_submit: async (data) => {
              let reward, mean;
              ({ score, reward, mean } = await api({
                fn: 'data',
                kwargs: {
                  worker_id,
                  batch_num: curr_batch_num,
                  you_choice: data.you_choice,
                  others_choice: data.others_choice,
                  ...trials[curr_batch_trial_index],
                },
              }));

              return { reward, mean };
            },
          },
        ],
        loop_function: () => {
          if (batch !== null && curr_batch_trial_index + 1 < trials.length) {
            curr_batch_trial_index++;
            return true;
          }
          return false;
        },
        conditional_function: () => {
          return trials.length > 0;
        },
      },
      {
        type: 'lupyanlab-new-batch-question',
        stimulus: 'Do you want to do another list for bonus pay?',
        choices: ['Yes.', 'No thanks.'],
        // Skip trial (0 second duration) if cannot allow more batches
        trial_duration: () => (allow_more_batches ? undefined : 0),
        on_response: async (data) => {
          if (data.button_pressed === '0') {
            ({ trials, num_trials, curr_batch_num, batch } = await api({
              fn: 'trials',
              kwargs: { worker_id, new_batch: true, max_batch_num },
            }));
            if (batch === null) {
              alert(
                'You have completed all available trials. You will be taken to the next section.',
              );
            }
            allow_more_batches = batch !== null && curr_batch_num < max_batch_num;
            get_new_batch = true;
            curr_batch_trial_index = 0;
          } else {
            get_new_batch = false;
          }
        },
      },
    ],
    loop_function: () => {
      return get_new_batch;
    },
  };

  timeline.push(batch_block);

  const demographics_questions_instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be done!
            </p> ${continue_space}`,
    ],
  };
  if (!completed_demographics) timeline.push(demographics_questions_instructions);

  const demographics_trial = {
    type: 'lupyanlab-surveyjs',
    questions: demographics_questions,
    on_finish: ({ response }) => {
      api({ fn: 'demographics', kwargs: { worker_id, demographics: response } });
    },
  };
  if (!completed_demographics) timeline.push(demographics_trial);

  const debrief_block = {
    type: 'html-keyboard-response',
    choices: [],
    stimulus: function() {
      return /* html */ `Thank you for participating!
        <p>The purpose of this HIT is to assess the extent to which different people agree what makes
        a particular dog, cat, or car typical.

        <p>
        If you have any questions or comments, please email cschonberg@wisc.edu.`;
    },
  };
  timeline.push(debrief_block);

  jsPsych.init({
    timeline: timeline,
    fullscreen,
    show_progress_bar: false,
    auto_update_progress_bar: false,
  });
})();
