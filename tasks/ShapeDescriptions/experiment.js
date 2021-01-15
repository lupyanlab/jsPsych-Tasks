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
  }.<br /><br /> Additional error logs:<br />${errors.join('<br />')}`;

const handleError = (error) => {
  console.error(error);
  const error_message = createErrorMessage(error);
  try {
    jsPsych.endExperiment(error_message);
  } catch (_) {
    document.body.innerHTML = error_message;
  }
};

//create random code for final message
function randLetter() {
  var a_z = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var int = Math.floor(Math.random() * a_z.length);
  var rand_letter = a_z[int];
  return rand_letter;
}

var secretCode = 'lswags'; // this is the 'key'
var code = '';

for (let i = 0; i < 7; i++) {
  code = code.concat(randLetter());
}

code = code.concat(secretCode);

for (let i = 0; i < 7; i++) {
  code = code.concat(randLetter());
}
//end code creation script

(async () => {
  try {
    let { workerId: worker_id, fullscreen, reset } = searchParams;

    // "task" will be automatically populated with the value of TASK
    const api = createApi(PORT, handleError);

    const {
      trials,
      num_trials,
      consent_agreed,
      completed_demographics,
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
        return api({ fn: 'consent', kwargs: { worker_id } });
      },
    };

    if (!consent_agreed) main_timeline.push(consent_trial);

    const instructions = {
      type: 'instructions',
      pages: [
        /* html */ `<p class="lead">In this HIT, you will see some dot patterns. On the left-top and right-top of the screen, you will also see two descriptions of the dot patterns from a previous turker. We want you to use these descriptions to sort the dot patterns into two groups. You will complete two sorts, with two sets of descriptions.
        </p> <p class="lead">The task is easy, but please take time to consider the descriptions. If you rush through without attending to the descriptions, we may deny payment.
        </p>`,
      ],
      show_clickable_nav: true,
    };
    if (has_trials_remaining.length > 0) main_timeline.push(instructions);

    const data_trials_block = {
      type: 'lupyanlab-shape-descriptions',
      timeline: trials.map((trial) => ({
        trial_progress_text: `Trial ${trial.trial_num} of ${num_trials}`,
        A: trial.A,
        B: trial.B,
        stimuli: trial.stimuli.map((stim) => `stimuli/${stim}`),
        stim_not_moved_alert: 'Please move all shapes to continue',
        finish_button_label: 'FINISH',
        stim_size: 100,
        on_start: () => {
          jsPsych.setProgressBar((trial.trial_num - 1) / num_trials);
        },
        on_finish: ({ rt, stim_infos, window_width, window_height }) => {
          return api({
            fn: 'data',
            kwargs: {
              worker_id,
              data: {
                ...trial,
                rt,
                response: stim_infos,
                window_width,
                window_height,
              },
            },
          });
        },
      })),
    };
    main_timeline.push(data_trials_block);

    const demographics_questions_instructions = {
      type: 'instructions',
      pages: [
        `<p class="lead">Thank you! We'll now ask a few demographic questions and then you'll be done!
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
          <p>The purpose of this HIT is to assess what makes a good category description.
  
          <p>
          If you have any questions or comments, please email suffill@wisc.edu.`+
          '<br>' +
          '<br>' +
          '<center>Your completion code for mTurk is</center>' +
          '<br>' +
          '<center><u><b style="font-size:20px">' +
          code +
          '</b></u></center>' +
          '<br>' +
          '<center>Please copy/paste this code into the mTurk box'
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
