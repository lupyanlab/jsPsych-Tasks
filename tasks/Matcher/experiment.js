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
      message: '<p>按下方的键可转至全屏模</p>',
      button_label: '继续',
    };

    if (fullscreen) main_timeline.push(fullscreen_trial);

    const consent_trial = {
      type: 'lupyanlab-consent',
      url: './consent.html',
      alert:
        '如果你想要继续参与，请勾选“我同意参加此实验”旁的方格。"',
      button_label: '开始实验',
      on_finish: () => {
        return api({ fn: 'consent', kwargs: { worker_id } });
      },
    };

    if (!consent_agreed) main_timeline.push(consent_trial);

    const instructions = {
      type: 'instructions',
      pages: [
        /* html */ `<p class="lead">你将会看到一个含有词语的网格和一条线索。请只选择网格中与线索相符的词语。</p> 
						<p>选择词语只需点击该词。如果你不想选择该词了，再次点击即可。如果你对自己的选择满意了，点击 “提交”。</p>`,
      ],
      show_clickable_nav: true,
	  button_label_previous: '上一页',
      button_label_next: '下一页',
    };
    if (has_trials_remaining > 0) main_timeline.push(instructions);

    const data_trials_block = {
      type: 'lupyanlab-matcher',
      no_cell_selected_message: '至少选择一个词',
      timeline: trials.map((trial) => ({
        prompt: `线索: "${trial.clue}"`,
        instructions: '选择（一个或一个以上）的符合线索的词',
        trial_progress_text: `第${trial.trial_num}题， 共${num_trials}题`,
        feedback_duration: 1000,
		submit_button_text: '提交',
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
        `<p class="lead">谢谢你！在结束以前，我们需要做一些关于您的背景调查。
              </p>`,
      ],
      show_clickable_nav: true,
	  button_label_previous: '上一页',
      button_label_next: '下一页',
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
	  properties: { locale: 'zh-cn', completeText: '继续' },
      on_finish: ({ response }) => {
        return api({ fn: 'demographics', kwargs: { worker_id, demographics: response } });
      },
    };
    if (!completed_demographics) main_timeline.push(demographics_trial);
	
	const phone_number_block = {
      type: 'survey-text',
      preamble: `<p>本研究的目的是检验人如何沟通类别信息的，比如“饮料”， “水域”。</p>`,
      questions: [
        {
          prompt: '请输入您绑定支付宝的手机号码以便于我们支付您的报酬（报酬将于两个工作日内到账）',
          rows: 1,
          columns: 40,
          inputType: 'tel',
		  required: true,
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
        <p>如果你有任何问题，请联系 qliu295@wisc.edu.</p>
        <br><br>`;
      },
    };
    main_timeline.push(debrief_block);


    jsPsych.init({
      timeline: main_timeline,
      fullscreen,
      show_progress_bar: true,
	  message_progress_bar: '完成进度',
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
