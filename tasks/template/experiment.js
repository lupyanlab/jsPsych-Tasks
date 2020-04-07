import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import createApi from '../../utils/create-api.js';
import demographics_questions from './demograhpics.js';

const TASK = 'template';

const images_folder_path = './images/';

const preloaderEl = document.createElement('img');
preloaderEl.src = '../../assets/preloader.gif';
document.body.appendChild(preloaderEl);

const searchParams = new URLSearchParams(window.location.search);
const worker_id = searchParams.get('worker_id');
const fullscreen = searchParams.get('fullscreen') === true;
const reset = searchParams.get('reset') === 'true';
const dev = searchParams.get('dev') === 'true';
const num_categories = Number(searchParams.get('num_categories')) || 2;

// "task" will be automatically populated with the value of TASK
const api = createApi(TASK, dev);

(async () => {
  await loadJsPsychPlugins();

  const { trials, num_trials } = await api({
    fn: 'trials',
    kwargs: { worker_id, num_images: num_categories, reset },
  });
  const main_timeline = [];

  const consent_trial = {
    type: 'lupyanlab-consent',
    welcome: `The HIT you are about to do is sponsored by University of Wisconsin-Madison. It is part of a protocol titled “Language and Human Cognition”.
      The task you are asked to do involves making simple responses to images, text, and/or sounds. For example, you may be asked how typical a picture of
      a dog is of dogs in general, to name a drawing, decide what word a sound makes you think of, to choose which visual pattern best completes a sequence
      of patterns, or indicate how vividly you see in your “mind’s eye.”
      <strong>HIT instructions will be provided on the next screen. </strong>`,
    consent: `This task has no anticipated risks nor direct benefits. If you have any questions or concerns
      about this HIT please contact the principal investigator: Dr. Gary Lupyan at lupyan@wisc.edu. If
      you are not satisfied with response of the research team, have more questions, or want totalk
      with someone about your rights as a research participant, you should contact University of
      Wisconsin’s Education Research and Social & Behavioral Science IRB Office at 608-263-2320. You
      are free to decline to participate or to end participation at any time for any reason.`,
    checkbox_label: 'By clicking this box, I consent to participate in this task.',
    alert:
      'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
    button_label: 'Start Experiment',
  };
  main_timeline.push(consent_trial);

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
  main_timeline.push(instructions);

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
      image: images_folder_path + trial.category + '/' + trial.image,
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
  main_timeline.push(image_trials_block);

  const demographics_questions_instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be done!
            </p> ${continue_space}`,
    ],
  };
  main_timeline.push(demographics_questions_instructions);

  const demographics_trial = {
    type: 'lupyanlab-surveyjs',
    questions: demographics_questions,
    on_finish: ({ response }) => {
      api({ fn: 'demographics', kwargs: { worker_id, demographics: response } });
    },
  };
  main_timeline.push(demographics_trial);

  jsPsych.init({
    timeline: main_timeline,
    fullscreen,
    show_progress_bar: true,
    auto_update_progress_bar: false,
  });
})();
