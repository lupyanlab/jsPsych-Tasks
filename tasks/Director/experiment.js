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
  `<h3>出现了一些错误。在联系我们之前，请尝试重新加载或检查您的网络连接。</h3>未知错误: ${
    error.message
  }.<br /> <br />其他错误日志:<br />${errors.join('<br />')}`;

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
    let { workerId: worker_id, fullscreen, reset, sona_id, experiment_id } = searchParams;

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

    // ////////////////////////////////
    // // Timeline
    // ////////////////////////////////
    const main_timeline = [];

    const fullscreen_trial = {
      type: 'fullscreen',
      fullscreen_mode: true,
      message: '<p>按下方的键可转至全屏模式</p>',
      button_label: '继续',
    };

    if (fullscreen) main_timeline.push(fullscreen_trial);

    const consent_trial = {
      type: 'lupyanlab-consent',
      url: './consent.html',
      alert: '如果您想要参与试验，您必须勾选 “我同意参与此研究“的方块',
      button_label: '开始实验',
      on_finish: () => {
        return api({ fn: 'consent', kwargs: { worker_id } });
      },
    };

    if (!consent_agreed) main_timeline.push(consent_trial);

    const instructions = {
      type: 'instructions',
      pages: [
        /* html */ `<p class="lead">在这个任务中，你将会看到一个由词填充的网格。其中的三个词会被标亮。</p>
     <p>你的任务是写一个词，或者一个短语，来帮助此任务中的另一个玩家（看不到哪些词被标亮）来选出，并只选出这三个标亮的词。</p>
     <p>你提供的线索不可以包括任何网格中现有的词。</p>`,
      ],
      show_clickable_nav: true,
      button_label_previous: '上一页',
      button_label_next: '下一页',
    };
    if (has_trials_remaining > 0) main_timeline.push(instructions);

    const data_trials_block = {
      type: 'lupyanlab-director',
      submit_button_text: '提交',
      prompt: '给出一个词或者短语来帮助一个玩家选择（并仅选择）标亮的词语。',
      same_clue_value_warning: '你提供的线索不可以包括任何网格中现有的词。',

      error_text: '请勿使用任何网格中的词',
      // Option 1: Checks if all characters in the word is included in the response
      match_fn: (response, word) => response.includes(word),
      // Option 2: Checks if any character in the word is included in the response
      // match_fn: (response, word) => word.split('').some((character) => response.includes(character)),
      error_required_text: '请输入内容',

      timeline: trials.map((trial) => ({
        trial_progress_text: `题目 ${trial.trial_num} （共 ${num_trials}题）`,
        terms: [
          [trial.target1, true, trial.target1_order],
          [trial.target2, true, trial.target2_order],
          [trial.target3, true, trial.target3_order],
          [trial.distractor1, false, trial.distractor1_order],
          [trial.distractor2, false, trial.distractor2_order],
          [trial.distractor3, false, trial.distractor3_order],
          [trial.distractor4, false, trial.distractor4_order],
          [trial.distractor5, false, trial.distractor5_order],
          [trial.distractor6, false, trial.distractor6_order],
        ]
          .sort((a, b) => a[2] - b[2])
          .map(([value, target]) => ({
            value,
            target,
          })),
        on_start: () => jsPsych.setProgressBar((trial.trial_num - 1) / num_trials),
        on_finish: ({ rt, response }) => {
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
        `<p class="lead">谢谢你！在结束以前，我们需要做一些关于您的背景调查。
              </p>`,
      ],
      show_clickable_nav: true,
      button_label_previous: '上一页',
      button_label_next: '下一页',
    };
    if (!completed_demographics) main_timeline.push(demographics_questions_instructions);

    const demographics_trial = {
      type: 'lupyanlab-surveyjs',
      questions: demographics_questions,
      properties: { locale: 'zh-cn', completeText: '继续' },
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

    const phone_number_block = {
      type: 'survey-text',
      preamble: `<p>本研究的目的是检验人如何沟通类别信息的，比如“饮料”， “水域”。</p>`,
      questions: [
        {
          prompt: '请输入您绑定支付宝的手机号码以便于我们支付您的报酬（报酬将于两个工作日内到账）',
          rows: 1,
          columns: 40,
          inputType: 'tel',
        },
      ],
      show_clickable_nav: false,
      button_label: '继续',
      on_finish: ({ responses }) => {
        const response = JSON.parse(responses).Q0;
        return api({
          fn: 'phone_number',
          kwargs: { worker_id, response: { phone_number: response } },
        });
      },
    };

    main_timeline.push(phone_number_block);

    const debrief_block = {
      type: 'html-keyboard-response',
      choices: [],
      stimulus: function() {
        return /* html */ `<p>感谢你的参与!</p>
        <p>如果你有任何问题，请联系 <qliu295@wisc.edu>.</p>
        <br><br>`;
      },
    };
    main_timeline.push(debrief_block);

    const credit_token = '';

    jsPsych.init({
      timeline: main_timeline,
      fullscreen,
      show_progress_bar: true,
      message_progress_bar: '完成进度',
      auto_update_progress_bar: false,
      on_finish: function() {
        if (experiment_id) {
          console.log(
            `https://uwmadison.sona-systems.com/webstudy_credit.aspx?experiment_id=${experiment_id}&credit_token=${credit_token}&survey_code=${sona_id}`,
          );
          window.open(
            `https://uwmadison.sona-systems.com/webstudy_credit.aspx?experiment_id=${experiment_id}&credit_token=${credit_token}&survey_code=${sona_id}`,
          );
        }
      },
    });
  } catch (error) {
    console.error(error);
    if (document.getElementById('preloader-gif-container') != null) {
      document.getElementById('preloader-gif-container').remove();
    }
    document.body.innerHTML = createErrorMessage(error);
  }
})();
