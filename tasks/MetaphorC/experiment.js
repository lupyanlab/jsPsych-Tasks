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
    let {
      workerId: worker_id,
      fullscreen,
      reset,
      max_batch_num,
      consent,
      is_skip = false,
      curr_batch_num,
    } = searchParams;

    // "task" will be automatically populated with the value of TASK
    const api = createApi(PORT, handleError);

    let {
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
      url: consent ? `${consent}.html` : 'consent.html',
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
        /*html*/ `<p class="lead"><b>感谢您参加这次实验!</b><br>
        整个实验中您会看到两两一组，共大约80组的词语，而您需要稍作思考，评价每对词语的相似度。`,

        /*html*/ `<p class="text-left">下面有两组词语作为例子:<br><br><b>睿智</b> vs <b>眼睛</b>. 他们有多么相似呢?<br><br>
        <b>厨房</b> vs <b>严厉</b>. 这组比较是否合适呢？.<br><br>
        虽然上面两组比较可能不算常见，但也许，相对于“厨房”和“严厉”，您感到“睿智”和“眼睛”更加相近。请留意同一组的两个词不一定属于同一词类，如“睿智”属于形容词，“眼睛”属于名词，所以<b>请不要把是否属于同一类词作为判断标准</b>。 <br><br>
  
        请为每组词在1-7的范围内做出评价，<b>1</b>表示两个词语完全不同且毫无相似之处，<b>7</b>表示两个词语非常相似。您可以用键盘上的1-7数字键，鼠标或者是触屏作答。`,

        /*html*/ `<p class="text-left">慢慢来，仔细考虑每组词语吧。</p>`,
      ],
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
              type: 'lupyanlab-word-ratings',
              input_feedback_duration: 800,
              skip_button_label: 'Skip',
              skip_label: '',
              skipped_recorded_value: 'NA',

              // Using an index inside a no-arg function is a workaround for dynamic number of batches
              question_prompt_pre: () => trials[i].question_prompt_pre,
              question_prompt_post: () => trials[i].question_prompt_post,
              trial_progress_text: () => `Trial ${trials[i].trial_num} of ${num_trials}`,
              choices: () => [
                trials[i].choice1,
                trials[i].choice2,
                trials[i].choice3,
                trials[i].choice4,
                trials[i].choice5,
                trials[i].choice6,
                trials[i].choice7,
              ],

              word: () => trials[i].word,
              is_skip,
              on_finish: (response) => {
                return api({
                  fn: 'data',
                  kwargs: {
                    worker_id,
                    data: {
                      subj_code: worker_id,
                      batch_num: curr_batch_num,
                      bin: trials[i].bin,
                      choice1: trials[i].choice1,
                      choice2: trials[i].choice2,
                      choice3: trials[i].choice3,
                      choice4: trials[i].choice4,
                      choice5: trials[i].choice5,
                      choice6: trials[i].choice6,
                      choice7: trials[i].choice7,
                      question_prompt_post: trials[i].question_prompt_post,
                      question_prompt_pre: trials[i].question_prompt_pre,
                      question_type: trials[i].question_type,
                      trial_num: trials[i].trial_num,
                      word: trials[i].word,
                      key: response.key,
                      response: response.response,
                      rt: response.rt,
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
          stimulus: '<p>Thank you for completing this batch of words</p>',
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
      pages: [
        /*html*/ `<p class="lead">谢谢您！接下来我们将收集一些您的背景信息，实验就完成了！
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
        return /* html */ `
        <p>
        If you have any questions or comments, please email qliu295@wisc.edu.`;
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
