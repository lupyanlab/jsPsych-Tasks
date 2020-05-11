import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import api from '../../utils/api.js';
import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';

const { workerId: worker_id, fullscreen, reset } = searchParams;

(async () => {
  await loadJsPsychPlugins();

  let {
    trials,
    num_trials,
    completed_demographics,
    consent_agreed,
    rel_images_folder_path,
    score,
    bonus,
  } = await api({
    fn: 'trials',
    kwargs: { worker_id, reset },
  });

  const timeline = [];

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

  const shape_trials_block = {
    type: 'lupyanlab-shape',
    prompt: 'Please name this shape',
    input_placeholder: 'type here',
    submit_button_label: 'Submit',
    // This message below is required as a fallback because we need to get the score and bonus from the api
    connection_outage_message:
      'Unable to connect to task. If you are not connected to the internet, please refresh page when connected again. Else please contact us.',
    input_feedback_duration: 500,
    timeline: trials.map((trial) => ({
      trial_progress_text: `Trial ${Number(trial.trial_number)} of ${num_trials}`,

      // Score and bonus are recomputed in task.py and returned from the data function
      score_text: () => `Your score: ${score}`,
      bonus_text: () => `Current bonus: $${Number(bonus).toFixed(2)}`,

      image: rel_images_folder_path + '/' + trial.stim_to_show,
      on_submit: async (data) => {
        ({ score, bonus } = await api({
          fn: 'data',
          kwargs: {
            worker_id,
            response: data.response,
            trial_list: trial.trial_list,
            trial_number: trial.trial_number,
            stim_to_show: trial.stim_to_show,
          },
        }));
      },
    })),
  };
  timeline.push(shape_trials_block);

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
