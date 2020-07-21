import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import api from '../../utils/api.js';
import demographics_questions from './demographics.js';
import searchParams from '../../utils/search-params.js';
import createPariticpantId from '../../utils/create-participant-id.js';

const participantId = createPariticpantId();

let { workerId: worker_id, fullscreen, reset, max_batch_num } = searchParams;
max_batch_num = Number(max_batch_num);

(async () => {
  await loadJsPsychPlugins();

  let { trials, num_trials, completed_demographics, consent_agreed, curr_batch_num } = await api({
    fn: 'trials',
    kwargs: { worker_id, reset, max_batch_num },
  });

  const timeline = [];

  const consent_trial = {
    type: 'lupyanlab-consent',
    url: './consent.html',
    alert:
      'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
    button_label: 'Start Experiment',
    on_finish: () => {
      api({ fn: 'consent', kwargs: { worker_id } });
    },
  };

  if (!consent_agreed) timeline.push(consent_trial);

  const continue_space = /* html */ `<div class='right small'>(press SPACE to continue)</div>`;

  const instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
pages: [
      `<p class="lead"><b>Thank you for participating in this experiment!</b><br>
      In this task you will be rating some English words on their "iconicity". Please read the following instructions very carefully as they are important for doing this task.`,

      `<p class="text-left">Some English words sound like what they mean. These words are <b>iconic</b>. You might be able to guess the meaning of such a word even if you did not know English.<br><br>
      Some words that people have rated <b>high</b> in iconicity are "screech", "twirl", and "ooze” because they sound very much like what they mean.<br><br>
      Some words that people have rated <b>moderate</b> in iconicity are “porcupine,” “glowing,” and “steep,” because they sound somewhat like what they mean.<br><br>
      Some words rated <b>low</b> in iconicity are “menu,” “amateur,” and “are,” because they do not sound at all like what they mean.<br><br>

      <b>In this task, you are going to rate words for how iconic they are. You will rate each word on a scale from 1 to 7. A rating of 1 indicates that the word is not at all iconic and does not at all sound like what it means. 7 indicates that the word is high in iconicity and sounds very much like what it means.</b>`,


      `<p class="text-left"></b>
      It is important that you say the word out loud to yourself, and that you think about its meaning.<br><br>

      If you are unsure of the meaning or the pronunciation of a word, you have the option of skipping it.`,

      `<p class="text-left"></b>
      Try to focus on the word meaning of the whole word, rather than decomposing it into parts. 
      For example, <b>when rating ‘butterfly’ think of the insect</b> rather than "butter" and "fly", and rate how well the whole meaning relates to the sound of the whole word "butterfly".`,

      `<p class="text-left">When you are done with this list of words, you will have the option to do 1-2 additional sets of words, which will earn you bonus pay.</p>
      `,

      `<p class="lead">Please remember to say the word to yourself and to think about the meaning of each word.<br><br>
      Ready to start?</p>`,

    ],    show_clickable_nav: true,
  };
  if (trials.length > 0) timeline.push(instructions);

  let allow_more_batches = isNaN(max_batch_num) || curr_batch_num < max_batch_num;
  let get_new_batch = false;
  let curr_batch_trial_index = 0;
  // let trial_number = 0; // This assumes at least one
  const batch_block = {
    timeline: [
      {
        timeline: [
          {
            type: 'lupyanlab-word-ratings',
            input_feedback_duration: 800,
            skip_button_label: 'Skip',
            skip_label: 'I don’t know the meaning or the pronunciation of this word.',
            skipped_recorded_value: 'NA',

            // Using an index inside a no-arg function is a workaround for dynamic number of batches
            question_prompt_pre: () => trials[curr_batch_trial_index].question_prompt_pre,
            question_prompt_post: () => trials[curr_batch_trial_index].question_prompt_post,
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

            word: () => trials[curr_batch_trial_index].word,
            on_finish: (response) => {
              const data = {
                subj_code: worker_id,
                batch_num: curr_batch_num,
                bin: trials[curr_batch_trial_index].bin,
                choice1: trials[curr_batch_trial_index].choice1,
                choice2: trials[curr_batch_trial_index].choice2,
                choice3: trials[curr_batch_trial_index].choice3,
                choice4: trials[curr_batch_trial_index].choice4,
                choice5: trials[curr_batch_trial_index].choice5,
                choice6: trials[curr_batch_trial_index].choice6,
                choice7: trials[curr_batch_trial_index].choice7,
                question_prompt_post: trials[curr_batch_trial_index].question_prompt_post,
                question_prompt_pre: trials[curr_batch_trial_index].question_prompt_pre,
                question_type: trials[curr_batch_trial_index].question_type,
                trial_number: trials[curr_batch_trial_index].trial_number,
                word: trials[curr_batch_trial_index].word,
                key: response.key,
                response: response.response,
                rt: response.rt,
              };

              api({
                fn: 'data',
                kwargs: {
                  worker_id,
                  data,
                  order: Object.keys(data),
                },
              });
            },
          },
        ],
        loop_function: () => {
          if (curr_batch_trial_index + 1 < trials.length) {
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
            ({ trials, num_trials, curr_batch_num } = await api({
              fn: 'trials',
              kwargs: { worker_id, new_batch: true, max_batch_num },
            }));
            allow_more_batches = curr_batch_num < max_batch_num;
            get_new_batch = true;
            curr_batch_trial_index = 0;
          } else {
            get_new_batch = false;
          }
        },
      },
    ],
    // trial_number starts with 1 and is incremented in the on_finish function
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
            </p>`,
    ],
    show_clickable_nav: true,
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
      return /* html */ `Thank you for participating! Your completion code is ${participantId}. Please paste the code into the mTurk Box.
      <p>The purpose of this task is to rank English words on iconicity to better understand the structure of language.
      <p>
      If you have any questions or comments, please email lupyan@wisc.edu.`;
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
