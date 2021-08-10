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
        /* html */ `<p class="lead">You will see a grid of words and a clue. Please select the words that match the clue, and only the words that match the clue.</p> 
						<p>To select a word, click on it. If you need to unselect it, click it again. When you are satisfied with your choices, click "Submit".</p>`,
      ],
      show_clickable_nav: true,
    };
    if (has_trials_remaining > 0) main_timeline.push(instructions);

    const data_trials_block = {
      type: 'lupyanlab-matcher',
      timeline: trials.map((trial) => ({
        prompt: `Clue: "${trial.clue}"\nclick on the correct words`,
        trial_progress_text: `Trial ${trial.trial_num} of ${num_trials}`,
        feedback_duration: 1000,
        terms: [
          [trial.target1, trial.target1_order],
          [trial.target2, trial.target2_order],
          [trial.target3, trial.target3_order],
          [trial.distractor1, trial.distractor1_order],
          [trial.distractor2, trial.distractor2_order],
          [trial.distractor3, trial.distractor3_order],
          [trial.distractor4, trial.distractor4_order],
          [trial.distractor5, trial.distractor5_order],
          [trial.distractor6, trial.distractor6_order],
        ]
          .sort((a, b) => a[1] - b[1])
          .map((t) => t[0]),
        on_start: () => jsPsych.setProgressBar((trial.trial_num - 1) / num_trials),
        on_finish: ({ rt, response }) => {
          return api({
            fn: 'data',
            kwargs: {
              worker_id,
              data: {
                target1_response: response[trial.target1_order - 1],
                target2_response: response[trial.target2_order - 1],
                target3_response: response[trial.target3_order - 1],
                distractor1_response: response[trial.distractor1_order - 1],
                distractor2_response: response[trial.distractor2_order - 1],
                distractor3_response: response[trial.distractor3_order - 1],
                distractor4_response: response[trial.distractor4_order - 1],
                distractor5_response: response[trial.distractor5_order - 1],
                distractor6_response: response[trial.distractor6_order - 1],
                rt,
                ...trial,
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
        `<p class="lead">Thank you! We'll now ask a few demographic questions. Then you'll be done!
              </p>`,
      ],
      show_clickable_nav: true,
    };
    if (!completed_demographics) main_timeline.push(demographics_questions_instructions);

    //create random code for final message
    const randLetter = () => {
      var a_z = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var int = Math.floor(Math.random() * a_z.length);
      var rand_letter = a_z[int];
      return rand_letter;
    };

    var secretCode = 'zsupz'; // this is the 'key'
    var code = '';

    for (let i = 0; i < 7; i++) {
      code = code.concat(randLetter());
    }

    code = code.concat(secretCode);

    for (let i = 0; i < 7; i++) {
      code = code.concat(randLetter());
    }

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
          <p>The purpose of this HIT is to investigate how people communicate about categories like "beverages" and "scenic places to visit".</p>
          <br><br>
          <center>Your completion code for mTurk is</center>
          <br>
          <center><u><b style="font-size:20px">${code}</b></u></center>
          <br>
          <center>Please copy/paste this code into the mTurk box'</center>
  
          <p>
          If you have any questions or comments, please email lrissman@wisc.edu.
          </p>`;
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
