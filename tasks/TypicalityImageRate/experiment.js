import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import api from '../../utils/api.js';
import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';

let { workerId: worker_id, fullscreen, reset, num_categories } = searchParams;
num_categories = Number(num_categories || 2);

(async () => {
  await loadJsPsychPlugins();

  const {
    trials,
    num_trials,
    completed_demographics,
    consent_agreed,
    rel_images_folder_path,
  } = await api({
    fn: 'trials',
    kwargs: { worker_id, reset, num_categories },
  });

  const timeline = [];

  const consent_trial = {
    type: 'lupyanlab-consent',
    url: './consent.html',
    alert:
      'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
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
      /* html */ `<p class="lead">In this HIT, you will see various images of familiar objects. For each image, please rate how typical it is of its category.
      For example, you may be shown a series of motorcycles and asked how typical each one is of motorcyles in general.
      </p> <p class="lead">Use the  1-5 keys on the keyboard to respond. 1 means very typical. 5 means very atypical. Please try to use the entire scale, not just the 1/5 keys. If you rush through without attending to the images, we may deny payment.
      </p> ${continue_space}`,
    ],
  };
  if (trials.length > 0) timeline.push(instructions);

  const image_trials_block = {
    type: 'lupyanlab-typicality-image-rate',
    score_prefix_label: 'Your score: ',
    score_suffix_label: '',
    bonus_prefix_label: 'Current bonus: $',
    bonus_suffix_label: '',
    question: 'Please name this shape',
    input_placeholder: 'type here',
    submit_button_label: 'Submit',
    input_feedback_duration: 500,
    // Nested timeline:  https://www.jspsych.org/overview/timeline/#nested-timelines
    timeline: trials.map((trial) => ({
      trial_progress_text: `Trial ${Number(trial.trial_number) + 1} of ${num_trials}`,
      prompt: `How typical is this ${trial.category}?`,
      image: rel_images_folder_path + '/' + trial.category + '/' + trial.image,
      shape_image: trial.shape_image,
      keys: trial.keys.split(','),
      labels: trial.labels.split(','),
      on_start: () => {
        jsPsych.setProgressBar((Number(trial.trial_number) + 1) / num_trials);
      },
      on_finish: ({ rt, key, label }) => {
        api({
          fn: 'data',
          kwargs: {
            choice_label: label,
            choice_key: key,
            worker_id,
            rt,
            image: trial.image,
            trial_number: trial.trial_number,
            category: trial.category,
          },
        });
      },
    })),
  };
  timeline.push(image_trials_block);

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
    show_progress_bar: true,
    auto_update_progress_bar: false,
  });
})();
