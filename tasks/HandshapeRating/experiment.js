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
        /* html */ `<p class="lead">People can form their hands into shapes, as in this picture: 
		</p> <p><img src='images/handshape_sample.jpg' style="padding:1em;height:150px;">
		
		</p> <p class="lead"> In this HIT, you will look at a picture of a hand and rate how well the shape of the hand matches the shape of an object in an illustration.

		</p> <p class="lead"> For example, the shape of the hand in the photo matches the shape of the croquet wickets in this illustration: 
		</p> <p><img src='images/ID_08.jpg' style="padding:1em;height:150px;">

		</p> <p class="lead"> By contrast, the shape of hand in the photo does not match the shape of the raccoon's hat in this illustration: 
		</p> <p> <img src='images/ID_29.jpg' style="padding:1em;height:150px;">
		
		</p> <p class="lead"> When making your decision, please consider the shape of the entire object (i.e. not just a part of the object).
		
        </p> <p class="lead">You will rate the pictures on a 1-5 scale: 1 means a poor match, 5 means an excellent match.  If you rush through without attending to the images, we may deny payment.
        </p>`,
      ],
      show_clickable_nav: true,
    };
    if (has_trials_remaining > 0) main_timeline.push(instructions);

    const data_trials_block = {
      type: 'lupyanlab-image-scale',
      input_feedback_duration: 500,

      timeline: trials.map((trial) => ({
        trial_progress_text: `Trial ${trial.trial_num} of ${num_trials}`,
        images: [`images/${trial.image1}`, `images/${trial.image2}`],
        question: trial.question,
        choices: [trial.choice_1, trial.choice_2, trial.choice_3, trial.choice_4, trial.choice_5],

        on_finish: ({ response, rt }) => {
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
