jsPsych.plugins['lupyanlab-concept'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-concept',
    parameters: {
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      concept_pre: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'CONCEPT: ',
      },
      concept: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      you_prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'YOU',
      },
      others_prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'OTHERS',
      },
      anchor_neg: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
      },
      anchor_pos: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
      },
      choices: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        default: undefined,
      },
      input_feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      reward_feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      on_submit: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        default: async () => {},
      },
      score: {
        type: jsPsych.plugins.parameterType.INT,
        default: 0,
      },
      reward_html: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        default: (reward) => `+${reward}`,
      },
      skip: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: false,
      },
      show_quit: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: false,
      },
      on_quit: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        default: () => {},
      },
      quit_text: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Quit',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    if (trial.skip) {
      jsPsych.finishTrial({});
      return;
    }

    display_element.innerHTML = /* html */ `
    <style>
      #plugin-scale-you .plugin-selected {
        background: linear-gradient(palegreen, mediumseagreen);
      }
      #plugin-scale-others .plugin-selected {
        background: linear-gradient(orange, darkorange);
      }
      #plugin-scale-others .plugin-mean {
        border: solid !important;
      }
      .disabled {
        cursor: not-allowed !important;
      }
      .transparent {
        opacity: 0.5;
      }
    </style>
    <div style="display:flex; flex-direction:column; align-items:center;">
      <div style="display:flex; width:40em; max-width:90vw;">
        ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
        <h3 style="color:red; margin-left:auto;">Score: ${trial.score}</h3>
      </div>
      ${
        trial.show_quit
          ? /* html */ `
            <div style="display:flex; width:40em; max-width:90vw;">
              <input id="plugin-quit" style="margin-left:auto;" type="button" value="${trial.quit_text}" />
            </div>`
          : ''
      }
      <h1>${trial.concept_pre + trial.concept}</h1>
      <div style="display:flex; flex-wrap:wrap; flex-direction:column; justify-content:center;">
        <div style="display:flex; flex-direction:column; align-items:center; margin:1em;">
          <h2 id="plugin-prompt-you">${trial.you_prompt}</h2>
          <div style="display:flex; flex-direction:column; justify-content:center; margin:1em; width:25em; max-width:90vw;">
            <div id="plugin-scale-you" style="margin:1em; display:grid; grid-template-rows:2em; grid-template-columns:${trial.choices
              .map(() => '1fr')
              .join(' ')}; border:solid; border-radius:0.5em;">
                ${trial.choices
                  .map(
                    (choice, i) =>
                      /*html*/ `<div choice="${choice}" id="plugin-choice-you-${choice}" style="display:flex; align-items:center; justify-content:center; border:thin solid; border-radius:0.3em; margin:0.1em; cursor:pointer;">${i +
                        1}</div>`,
                  )
                  .join('')}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h4 style="margin:0;">${trial.anchor_neg}</h4>
                <h4 style="margin:0;">${trial.anchor_pos}</h4>
              </div>
          </div>
        </div>
        <div style="border:thin dashed;"></div>
        <div id="plugin-others" class="transparent" style="display:flex; flex-direction:column; align-items:center; margin:1em;">
          <h2 id="plugin-prompt-others">${trial.others_prompt} <span id="plugin-reward"></span></h2>
          <div style="display:flex; flex-direction:column; justify-content:center; margin:1em; width:25em; max-width:90vw;">
            <div id="plugin-scale-others" style="margin:1em; display:grid; grid-template-rows:2em; grid-template-columns:${trial.choices
              .map(() => '1fr')
              .join(' ')}; border:solid; border-radius:0.5em;">
                ${trial.choices
                  .map(
                    (choice, i) =>
                      /*html*/ `<div choice="${choice}" id="plugin-choice-others-${choice}" style="display:flex; align-items:center; justify-content:center; border:thin solid; border-radius:0.3em; margin:0.1em; cursor:pointer;">${i +
                        1}</div>`,
                  )
                  .join('')}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h4 style="margin:0;">${trial.anchor_neg}</h4>
                <h4 style="margin:0;">${trial.anchor_pos}</h4>
              </div>
          </div>
        </div>
      </div>
    </div>
    `;

    if (trial.show_quit) {
      document.querySelector('#plugin-quit').addEventListener('click', () => {
        trial.on_quit();
        jsPsych.finishTrial({});
        return;
      });
    }

    const startTime = performance.now();
    const enableChoices = (enable, type) => {
      if (!enable) {
        display_element.querySelector(`#plugin-scale-${type}`).classList.add('disabled');
        trial.choices.forEach((choice) => {
          display_element
            .querySelector(`#plugin-choice-${type}-${choice}`)
            .classList.add('disabled');
        });
        display_element.querySelector(`#plugin-prompt-${type}`).classList.add('disabled');
      } else {
        display_element.querySelector(`#plugin-scale-${type}`).classList.remove('disabled');
        display_element.querySelector(`#plugin-${type}`).classList.remove('transparent');
        trial.choices.forEach((choice) => {
          display_element
            .querySelector(`#plugin-choice-${type}-${choice}`)
            .classList.remove('disabled');
        });
        display_element.querySelector(`#plugin-prompt-${type}`).classList.remove('disabled');
      }
    };

    enableChoices(false, 'others');
    let youState = true;
    let done = false;
    let waiting = false;
    let you_choice;
    let others_choice;
    const selectChoice = async (choice) => {
      if (!waiting) {
        waiting = true;
        let type;
        if (youState) {
          type = 'you';
          you_choice = choice;
        } else {
          type = 'others';
          others_choice = choice;
          done = true;
        }

        display_element
          .querySelector(`#plugin-choice-${type}-${choice}`)
          .classList.add('plugin-selected');

        enableChoices(false, 'you');
        enableChoices(false, 'others');
        let trial_data;

        if (done) {
          const endTime = performance.now();
          const rt = endTime - startTime;

          // data saving
          trial_data = {
            rt,
            you_choice: you_choice,
            others_choice: others_choice,
          };
          let { reward, mean } = await trial.on_submit(trial_data);
          reward = Number(reward);
          display_element.querySelector('#plugin-reward').innerHTML = trial.reward_html(reward);
          if (mean !== null) {
            display_element
              .querySelector(`#plugin-choice-others-${Math.floor(mean)}`)
              .classList.add('plugin-mean');
          }
          await new Promise((resolve) =>
            jsPsych.pluginAPI.setTimeout(resolve, trial.reward_feedback_duration),
          );
        }

        jsPsych.pluginAPI.setTimeout(function() {
          if (youState) {
            enableChoices(true, 'others');
            youState = false;
          } else {
            // end trial
            jsPsych.finishTrial(trial_data);
          }
          waiting = false;
        }, trial.input_feedback_duration);
      }
    };

    trial.choices.forEach((choice) => {
      display_element
        .querySelector(`#plugin-choice-you-${choice}`)
        .addEventListener('click', () => {
          if (youState) {
            selectChoice(choice);
          }
        });
      display_element
        .querySelector(`#plugin-choice-others-${choice}`)
        .addEventListener('click', () => {
          if (!youState && !done) {
            selectChoice(choice);
          }
        });
    });

    jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: ({ key: keyCode }) => {
        if (!done) {
          const key = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(keyCode);
          selectChoice(key);
        }
      },
      valid_responses: trial.choices.map((choice) =>
        jsPsych.pluginAPI.convertKeyCharacterToKeyCode(String(choice)),
      ),
      rt_method: 'performance',
      persist: true, // jsPsych.pluginAPI.cancelKeyboardResponse
      allow_held_key: false,
    });
  };

  return plugin;
})();
