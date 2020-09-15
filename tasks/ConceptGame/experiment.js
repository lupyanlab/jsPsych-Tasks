import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import api from '../../utils/api.js';
import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';

let { workerId: worker_id, fullscreen, reset, max_trials, min_trials, group } = searchParams;
max_trials = Number(max_trials);
min_trials = Number(min_trials);

(async () => {
  await loadJsPsychPlugins();

  let {
    trials,
    num_trials,
    completed_demographics,
    consent_agreed,
    score,
    ...trials_response
  } = await api({
    fn: 'trials',
    kwargs: {
      worker_id: worker_id || localStorage.getItem('workerId'),
      reset,
      max_trials,
      min_trials,
      group,
    },
  });

  ({ min_trials, max_trials } = trials_response);

  worker_id = trials_response['worker_id'];
  localStorage.setItem('workerId', worker_id);

  const timeline = [];

  const consent_trial = {
    type: 'lupyanlab-consent',
    url: './consent.html',
    alert:
      'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
    button_label: 'Start Experiment',
    on_finish: () => {
      api({ fn: 'consent', kwargs: { worker_id } });
    },
  };

  if (!consent_agreed) timeline.push(consent_trial);

  const continue_space = /* html */ `<div class='right small'>(press SPACE to continue)</div>`;

  const instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      /* html */ `<p class="lead">Instructions
      </p> <p class="lead">TODO</p> ${continue_space}`,
    ],
    show_clickable_nav: true,
  };
  if (trials.length > 0) timeline.push(instructions);

  let quit_selected = false;

  const plugin_trial = {
    type: 'lupyanlab-concept',
    input_feedback_duration: 500,
    reward_feedback_duration: 1500,
    quit_text: 'Quit',
    timeline: trials.map((trial) => ({
      reward_html: (reward) => {
        if (reward == 0) {
          return `<span style="color:grey;">+${reward}</span>`;
        } else if (reward < 6) {
          return `<span style="color:red;">+${reward}!</span>`;
        }
        return `<span style="color:red; font-size:1.5em;">+${reward}!</span>`;
      },

      trial_progress_text: `Trial ${Number(trial.trial_number)} of ${num_trials}`,
      choices: [
        trial.choice1,
        trial.choice2,
        trial.choice3,
        trial.choice4,
        trial.choice5,
        trial.choice6,
        trial.choice7,
      ],
      concept: trial.concept,
      concept_pre: trial.concept_pre,
      you_prompt: trial.you_prompt,
      others_prompt: trial.others_prompt,
      anchor_neg: trial.anchor_neg,
      anchor_pos: trial.anchor_pos,
      score: () => score,
      skip: () => quit_selected,
      show_quit:
        min_trials !== undefined &&
        min_trials !== null &&
        !Number.isNaN(min_trials) &&
        trial.trial_number > min_trials,
      on_quit: () => {
        quit_selected = true;
      },
      on_submit: async (data) => {
        let reward, mean;
        ({ score, reward, mean } = await api({
          fn: 'data',
          kwargs: {
            worker_id,
            you_choice: data.you_choice,
            others_choice: data.others_choice,
            ...trial,
          },
        }));

        return { reward, mean };
      },
    })),
  };

  timeline.push(plugin_trial);

  const rankings_trial = {
    type: 'lupyanlab-async-instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      async () => {
        const { rankings, score, weighted_score, num_scores, rank } = await api({
          fn: 'rankings',
          kwargs: { worker_id: worker_id },
        });

        return /* html */ `
            <style>
                table,
                td {
                    border: 1px solid #333;
                }

                thead,
                tfoot {
                    background-color: #333;
                    color: #fff;
                }
            </style>
            <h1>Rankings</h1>
            <table style="width:100%">
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Nickname</th>
                  <th>Raw Score</th>
                  <th>Weighted Score</th>
                </tr>
              </thead>
              <tbody>
                ${rankings
                  .map(
                    ([worker_id, score, weighted_score], i) => /*html*/ `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${worker_id}</td>
                      <td>${score}</td>
                      <td>${Math.round(weighted_score * 100) / 100}</td>
                    </tr>
                  `,
                  )
                  .join('')}
              </tbody>
            </table>
            <h2>My Ranking</h2>
            <table style="width:100%">
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Nickname</th>
                  <th>Raw Score</th>
                  <th>Weighted Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>${rank}</b> / ${num_scores}</td>
                  <td>${worker_id}</td>
                  <td>${score}</td>
                  <td>${Math.round(weighted_score * 100) / 100}</td>
                </tr>
              </tbody>
            </table>
            ${continue_space}`;
      },
    ],
    show_clickable_nav: true,
  };

  timeline.push(rankings_trial);

  const demographics_questions_instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be done!
            </p> ${continue_space}`,
    ],
  };
  if (!completed_demographics) timeline.push(demographics_questions_instructions);

  const demographics_trial = {
    type: 'lupyanlab-surveyjs',
    questions: demographics_questions,
    on_finish: ({ response }) => {
      api({ fn: 'demographics', kwargs: { worker_id, demographics: response } });
    },
  };
  if (!completed_demographics) timeline.push(demographics_trial);

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
  timeline.push(debrief_block);

  jsPsych.init({
    timeline: timeline,
    fullscreen,
    show_progress_bar: false,
    auto_update_progress_bar: false,
  });
})();
