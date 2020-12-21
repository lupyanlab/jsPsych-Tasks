import createApi from '../../utils/create-api.js';
import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';
import PORT from './port.js';

const createErrorMessage = (error) =>
  `<h3>Something went wrong. Please try reloading again and check your connection before contacting us.</h3>Unexpected error: ${error.message}.`;

(async () => {
  try {
    let { workerId: worker_id, fullscreen, reset } = searchParams;

    // "task" will be automatically populated with the value of TASK
    const api = createApi(PORT);

    const {
      trials,
      // num_trials,
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
        /* html */ `<p class="lead">In this HIT, you will see various images of familiar objects. For each image, please rate how typical it is of its category.
        For example, you may be shown a series of motorcycles and asked how typical each one is of motorcyles in general.
        </p> <p class="lead">Use the  1-5 keys on the keyboard to respond. 1 means very typical. 5 means very atypical. Please try to use the entire scale, not just the 1/5 keys. If you rush through without attending to the images, we may deny payment.
        </p>`,
      ],
      show_clickable_nav: true,
    };
    if (has_trials_remaining.length > 0) main_timeline.push(instructions);

    // const image_trials_block = {
    //   type: 'lupyanlab-typicality-image-rate',
    //   score_prefix_label: 'Your score: ',
    //   score_suffix_label: '',
    //   bonus_prefix_label: 'Current bonus: $',
    //   bonus_suffix_label: '',
    //   question: 'Please name this shape',
    //   input_placeholder: 'type here',
    //   submit_button_label: 'Submit',
    //   input_feedback_duration: 500,
    //   // Nested timeline:  https://www.jspsych.org/overview/timeline/#nested-timelines
    //   timeline: trials.map((trial) => ({
    //     trial_progress_text: `Trial ${Number(trial.trial_number) + 1} of ${num_trials}`,
    //     prompt: `How typical is this ${trial.category}?`,
    //     image: images_folder_path + trial.category + '/' + trial.image,
    //     shape_image: trial.shape_image,
    //     keys: trial.keys.split(','),
    //     labels: trial.labels.split(','),
    //     on_start: () => {
    //       jsPsych.setProgressBar((Number(trial.trial_number) + 1) / num_trials);
    //     },
    //     on_finish: ({ rt, key, label }) => {
    //       api({
    //         fn: 'data',
    //         kwargs: {
    //           choice_label: label,
    //           choice_key: key,
    //           worker_id,
    //           rt,
    //           image: trial.image,
    //           trial_number: trial.trial_number,
    //           category: trial.category,
    //         },
    //       });
    //     },
    //   })),
    // };
    // main_timeline.push(image_trials_block);

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
      on_finish: (response) => {
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
