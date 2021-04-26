import createApi from '../../utils/create-api.js';
import searchParams from '../../utils/search-params.js';
import PORT from './port.js';

const errors = [];

const old_console_error = console.error;
console.error = function(message) {
  errors.push(message);
  old_console_error.apply(console, arguments);
};

(async () => {
  let {
    workerId: worker_id,
    fullscreen,
    reset,
    max_batch_num = 2,
    consent = 'consent',
    lang = 'en',
  } = searchParams;

  let texts;
  let demographics_questions;
  try {
    texts = (await import(`./texts/${lang}/texts.js`)).default;
    demographics_questions = (await import(`./texts/${lang}/demographics.js`)).default;
  } catch (e) {
    console.error(e);
    throw Error(`Could not import texts with language '${lang}'.`);
  }

  const createErrorMessage = (error) =>
    `${texts.ERROR_MESSAGE} Unexpected error: ${
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

  try {
    // "task" will be automatically populated with the value of TASK
    const api = createApi(PORT, handleError);

    let {
      trials,
      num_trials,
      consent_agreed,
      completed_demographics,
      curr_batch_num,
      ...trials_response
    } = await api({
      fn: 'trials',
      kwargs: {
        worker_id: worker_id || localStorage.getItem('workerId'),
        reset,
        max_batch_num,
      },
    });

    const has_trials_remaining = trials.length > 0;

    ({ worker_id, max_batch_num } = trials_response);
    localStorage.setItem('workerId', worker_id);

    ////////////////////////////////
    // Timeline
    ////////////////////////////////
    const main_timeline = [];

    const fullscreen_trial = {
      type: 'fullscreen',
      fullscreen_mode: true,
      message: texts.FULL_SCREEN_MESSAGE,
      button_label: 'Continue',
    };

    if (fullscreen) main_timeline.push(fullscreen_trial);

    const consent_trial = {
      type: 'lupyanlab-consent',
      url: `texts/${lang}/${consent}.html`,
      alert: texts.CONSENT_ALERT,
      button_label: texts.START_EXPERIMENT_BUTTON_LABEL,
      on_finish: () => {
        return api({ fn: 'consent', kwargs: { worker_id } });
      },
    };

    if (!consent_agreed) main_timeline.push(consent_trial);

    const instructions = {
      type: 'instructions',
      pages: texts.INSTRUCTIONS,
      show_clickable_nav: true,
    };
    if (has_trials_remaining > 0) main_timeline.push(instructions);

    let has_batches_remaining = await api({ fn: 'has_batches_remaining', kwargs: { worker_id } });
    console.log(has_batches_remaining);
    let allow_more_batches =
      has_batches_remaining && (isNaN(max_batch_num) || curr_batch_num < max_batch_num);
    let get_new_batch = false;

    let i = 0; // curr_batch_trial_index

    const batch_block = {
      timeline: [
        {
          timeline: [
            {
              type: 'lupyanlab-text-area',
              trial_progress_text: () => `Trial ${trials[i].trial_num} of ${num_trials}`,
              stimulus: () => `images/${trials[i].image}`,
              question: () => trials[i].naming_question,
              placeholder: texts.TEXT_AREA_PLACEHOLDER,
              min_chars_required: 3,
              trim_response_string: true,
              on_start: () => {
                jsPsych.setProgressBar((trials[i].trial_num - 1) / num_trials);
              },
            },
            {
              type: 'lupyanlab-survey-likert-skip',
              trial_progress_text: () => `Trial ${trials[i].trial_num} of ${num_trials}`,
              skippable: false,
              preamble: () => /*html*/ `
                <h6 style="text-align:center;margin-top:0;width:50vw;margin:auto;">Trial ${trials[i].trial_num} of ${num_trials}</h6>
              `,
              questions: () => [
                {
                  key: trials[i].question_type,
                  prompt: /*html*/ `
                  <img src="images/${trials[i].image}" /><br>
                  <h4><b>${jsPsych.data.getLastTimelineData().values()[0].response}</b></h4>
                  <h4>${trials[i].confidence_question}</h4>
              `,
                  labels: texts.LABELS,
                  required: true,
                },
              ],

              on_finish: (data) => {
                const lastTrialData = jsPsych.data.getLastTimelineData().values()[0];

                return api({
                  fn: 'data',
                  kwargs: {
                    worker_id,
                    data: {
                      subj_code: worker_id,
                      batch_num: curr_batch_num,
                      naming_question: trials[i].naming_question,
                      naming_expTimer: lastTrialData.time_elapsed / 1000,
                      naming_rt: lastTrialData.rt,
                      nameing_response: lastTrialData.response,
                      goodness_of_fit_rt: data.rt,
                      goodness_of_fit_expTimer: data.time_elapsed / 1000,
                      goodness_of_fit: JSON.parse(data.responses).Q0 + 1,
                      confidence_question: trials[i].confidence_question,
                      trial_num: trials[i].trial_num,
                      image: trials[i].image,
                      trial_list_num: trials[i].trial_list_num,
                      batchFile: trials[i].batchFile,
                    },
                  },
                });
              },
            },
          ],
          loop_function: () => {
            if (i + 1 < trials.length) {
              i++;
              return true;
            }
            return false;
          },
          conditional_function: () => {
            return trials.length > 0;
          },
          on_finish: () => {},
        },
        {
          type: 'lupyanlab-new-batch-question',
          stimulus: texts.NEW_BATCH_PROMPT,
          // stimulus: 'Do you want to do another list for bonus pay?',
          choices: ['Start next batch.'],
          // choices: ['Yes.', 'No thanks.'],
          // Skip trial (0 second duration) if cannot allow more batches
          trial_duration: () => (allow_more_batches ? undefined : 0),
          on_response: async (data) => {
            if (data.button_pressed === '0') {
              ({ trials, num_trials, curr_batch_num } = await api({
                fn: 'trials',
                kwargs: { worker_id, new_batch: true, max_batch_num },
              }));
              has_batches_remaining = await api({
                fn: 'has_batches_remaining',
                kwargs: { worker_id },
              });
              allow_more_batches = has_batches_remaining && curr_batch_num < max_batch_num;
              get_new_batch = true;
              i = 0;
            } else {
              get_new_batch = false;
            }
          },
        },
      ],
      // trial_num starts with 1 and is incremented in the on_finish function
      loop_function: () => {
        return get_new_batch;
      },
    };

    main_timeline.push(batch_block);

    const demographics_questions_instructions = {
      type: 'instructions',
      pages: texts.DEMOGRAPHICS_INSTRUCTIONS,
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
        return texts.DEBRIEF_TEXT();
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
