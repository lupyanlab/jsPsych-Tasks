import createApi from '../../utils/create-api.js';
import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';
import PORT from './port.js';

const errors = [];

const old_console_error = console.error;
console.error = function(message) {
  errors.push(message);
  old_console_error.apply(console, arguments);
};

const createErrorMessage = (error) =>
  `<h3>Something went wrong. Please try reloading again and check your connection before contacting us.</h3>Unexpected error: ${
    error.message
  }.<br /> <br />Additional error logs:<br />${errors.join('<br />')}`;

const handleError = (error) => {
  console.error(error);
  const error_message = createErrorMessage(error);
  try {
    jsPsych.endExperiment(error_message);
  } catch (_) {
    document.body.innerHTML = error_message;
  }
};

(async () => {
  try {
    let { workerId: worker_id, fullscreen, reset } = searchParams;

    // "task" will be automatically populated with the value of TASK
    const api = createApi(PORT, handleError);

    let {
      trials,
      num_trials,
      consent_agreed,
      completed_demographics,
      rel_images_folder_path,
      score,
      bonus,
      ...trials_response
    } = await api({
      fn: 'trials',
      kwargs: {
        worker_id: worker_id || localStorage.getItem('workerId'),
        reset,
      },
    });

    const has_trials_remaining = trials.length > 0;

    worker_id = trials_response['worker_id'];
    localStorage.setItem('workerId', worker_id);

    ////////////////////////////////
    // Timeline
    ////////////////////////////////
    const main_timeline = [];

    const fullscreen_trial = {
      type: 'fullscreen',
      fullscreen_mode: true,
      message: '<p>This will switch to full screen mode when you press the button below</p>',
      button_label: 'Continue',
    };

    if (fullscreen) main_timeline.push(fullscreen_trial);

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

    if (!consent_agreed) main_timeline.push(consent_trial);

    const instructions = {
      type: 'instructions',
      key_forward: 'space',
      key_backward: 'backspace',
      pages: [
        /* html */ `<p class="lead">In this HIT, you will see various images of familiar objects. For each image, please rate how typical it is of its category.
        For example, you may be shown a series of motorcycles and asked how typical each one is of motorcyles in general.
        </p> <p class="lead">Use the  1-5 keys on the keyboard to respond. 1 means very typical. 5 means very atypical. Please try to use the entire scale, not just the 1/5 keys. If you rush through without attending to the images, we may deny payment.
        </p>`,
      ],
      show_clickable_nav: true,
    };
    if (has_trials_remaining > 0) main_timeline.push(instructions);

    const data_trials_block = {
      type: 'lupyanlab-shape',
      prompt: 'Please name this shape',
      input_placeholder: 'type here',
      submit_button_label: 'Submit',
      // This message below is required as a fallback because we need to get the score and bonus from the api
      connection_outage_message:
        'Unable to connect to task. If you are not connected to the internet, please refresh page when connected again. Else please contact us.',
      input_feedback_duration: 500,
      diff_flashing_interval: 500,
      num_diff_flashes: 2,
      timeline: trials.map((trial) => ({
        trial_progress_text: `Trial ${Number(trial.trial_num)} of ${num_trials}`,

        // Score and bonus are recomputed in task.py and returned from the data function
        score_text: () => `Your score: ${score}`,
        bonus_text: () => `Current bonus: $${Number(bonus).toFixed(2)}`,

        image: rel_images_folder_path + '/' + trial.stim_to_show,
        on_submit: async (data) => {
          ({ score, bonus } = await api({
            fn: 'data',
            kwargs: {
              worker_id,
              data: {
                ...trial,
                worker_id,
                response: data.response,
                trial_list: trial.trial_list,
                trial_number: trial.trial_number,
                stim_to_show: trial.stim_to_show,
              },
            },
          }));
        },
      })),
    };
    main_timeline.push(data_trials_block);

    const demographics_questions_instructions = {
      type: 'instructions',
      pages: [
        `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be transferred to a qualtrics survey. Then you'll be done!
              </p>`,
      ],
      show_clickable_nav: true,
    };
    if (!completed_demographics) main_timeline.push(demographics_questions_instructions);

    const demographics_trial = {
      type: 'lupyanlab-surveyjs',
      questions: demographics_questions,
      on_finish: ({ response }) => {
        return api({ fn: 'demographics', kwargs: { worker_id, demographics: response } });
      },
    };
    if (!completed_demographics) main_timeline.push(demographics_trial);

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
    main_timeline.push(debrief_block);

    jsPsych.init({
      timeline: main_timeline,
      fullscreen,
      show_progress_bar: true,
      auto_update_progress_bar: false,
    });
  } catch (error) {
    console.error(error);
    if (document.getElementById('preloader-gif-container') != null) {
      document.getElementById('preloader-gif-container').remove();
    }
    document.body.innerHTML = createErrorMessage(error);
  }
})();
