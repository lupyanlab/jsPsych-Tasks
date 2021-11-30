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
        /* html */ `<p class="lead">In this HIT, you will be asked to rate the similarity of words by placing them closer together or further apart.
        For example, you may be shown the words <i>dog</i>, <i>cat</i>, and <i>horse</i>.
        If cat is the middle word, you might think it is more similar to dog than to horse.
        </p> <p class="lead">Click and drag the middle word (e.g. cat) toward the left or right to indicate which word it is more similar to.
        You can use the whole scale, so if you think cat is only slightly more similar to dog than to horse, you can put it just to the left of the center, rather than all the way over to the left.
        </p> <p class="lead">Once you are happy with your placement (even if it is just right in the middle) click <b>seems good</b>.
        If you are having trouble deciding where to move the center word, you can click <b>can't decide</b> to move to the next item.
        There is a timer, so don't hesitate too long!
        </p> <p class="lead">If you rush through without attempting to move any of the sliders or move them randomly, we may deny payment.
        </p>`,
      ],
      show_clickable_nav: true,
    };
    if (has_trials_remaining > 0) main_timeline.push(instructions);

    const data_trials_block = {
      type: 'lupyanlab-word-game',
      input_feedback_duration: 500,
      no_move_label: "I can't decide",
      move_label: 'Seems good to me',
      timeline: trials.map((trial) => ({
        prompt:
          trial.question_type === 'practice'
            ? /*html*/ `Drag the word in the center towards the word it is most similar to. <br>
  If you think a dog is the same as a cat, drag dog all the way to cat. <br>
  If you think a dog is equally similar to a cat and a horse, leave it in the middle. <br>
  If you think it is somewhere in between, drag it to wherever you think is most appropriate. <br>
  After you are done moving the slider, select one of the two tick boxes.`
            : '',
        min: Number(trial.min),
        max: Number(trial.max),
        default: Number(trial.default),
        timer: trial.max_duration,
        words: trial.left_words.split(',').map((_, i) => ({
          left_word: trial.left_words.split(',')[i],
          middle_word: trial.slider_words.split(',')[i],
          right_word: trial.right_words.split(',')[i],
        })),
        questions: [{ prompt: '', name: '', rows: 1, columns: 30, required: true }],
        on_start: () => {
          jsPsych.setProgressBar((trial.trial_num - 1) / num_trials);
        },
        on_finish: ({ rt, choices, sliders }) => {
          return api({
            fn: 'data',
            kwargs: {
              worker_id,
              data: {
                sliders: sliders.join(','),
                choices: choices.join(','),
                rt: rt.join(','),
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
