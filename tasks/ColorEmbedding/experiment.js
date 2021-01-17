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
  jsPsych.endExperiment(createErrorMessage(error));
};

(async () => {
  try {
    let { workerId: worker_id, fullscreen, reset } = searchParams;

    if (worker_id) {
      //make sure that nobody can enter anything damaging or crazy for workerId
      worker_id.replace(/[^A-Za-z0-9_]/g, '');
    }

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
        /* html */ `You will be shown about 100 word pairs. One is a color (e.g., "red"). The other is an adjective (e.g., "fast"). Your task is to respond with a word that is well described by that color and the. <br><br>
        For example, if asked about something that is <b>red</b> and <b>fast</b>, you might say sportscar. <br><br>
        Some combinations might seem odd. It might be hard to think of something that is "silver" and "ripe", or something that is "blue" and "selfish". For such pairs, just follow your intuition. No need to overthink it. <br><br>
        Please restrict your responses to a single word. <br><br>

Press Continue to begin.<br>`,
      ],
      show_clickable_nav: true,
    };
    //if (has_trials_remaining.length > 0) main_timeline.push(instructions);
     if (has_trials_remaining ) main_timeline.push(instructions);

    const data_trials_block = {
      type: 'survey-text',
      input_feedback_duration: 500,
      timeline: trials.map((trial) => ({
        preamble: /*html*/ `What is something that is 
          <br><br>
          <b>${trial.r1}</b> and <b>${trial.r2}</b>?
          <br><br>
          <br><br>
          <br>`,
        questions: [{ prompt: '', name: '', rows: 1, columns: 30, required: true }],
        on_start: () => {
          jsPsych.setProgressBar((trial.trial_num - 1) / num_trials);
        },
        on_finish: ({ rt, responses }) => {
          const response = JSON.parse(responses).Q0;

          return api({
            fn: 'data',
            kwargs: {
              worker_id,
              data: {
                response,
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

    const debrief_block = {
      type: 'html-keyboard-response',
      choices: [],
      stimulus: function() {
        return /* html */ `<p>Thanks for participating!</p>" 
        <p>If you have any questions, please feel free to send us a message (lrissman@wisc.edu).</p>
        <br><br>
        <center>Your completion code for mTurk is</center>
        <br>
        <center><u><b style="font-size:20px">${code}</b></u></center>
        <br>
        <center>Please copy/paste this code into the mTurk box' 
        <p><b>Click the Continue button to complete the experiment.</b> Thank you!</p>`;
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
