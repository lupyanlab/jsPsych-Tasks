/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-word-game'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'PLUGIN-NAME',
    parameters: {
      prompt: {
        type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      words: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        nested: {
          left_word: {
            type: jsPsych.plugins.parameterType.STRING,
            default: undefined,
          },
          middle_word: {
            type: jsPsych.plugins.parameterType.STRING,
            default: undefined,
          },
          right_word: {
            type: jsPsych.plugins.parameterType.STRING,
            default: undefined,
          },
        },
      },
      no_move_label: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      move_label: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      min: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      max: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      default: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      timer: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
      <style>
        .slider {
          margin: 0;
          -webkit-appearance: none;
          width: 100%;
          height: 15px;
          border-radius: 5px;  
          background: #d3d3d3;
          outline: none;
          opacity: 0.7;
          -webkit-transition: .2s;
          transition: opacity .2s;
        }

        .slider:disabled {
          filter: grayscale(1);
          cursor: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 50px;
          height: 50px;
          background: white;
          border: solid;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 50px;
          height: 50px;
          background: white;
          border: solid;
          cursor: pointer;
        }
      </style>
      <style id="plugin-styles"></style>
      <div style="width:100%; display:flex; justify-content:right;">
        <div>
          <div>Timer: <span id="plugin-timer">${trial.timer}</span> seconds</div>
          <div style="width:100%; display:flex; justify-content:center;">
            <div style="width:10em; height: 2em; border:solid;">
              <div id="plugin-timer-bar" style="width:100%;background-color:gray;height:100%;"></div>
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex; justify-content:center; text-align:left;">
        <div>${trial.prompt}</div>
      </div>
      ${trial.words
        .map(
          ({ left_word, middle_word, right_word }, i) => /*html*/ `
            <form id="plugin-form-${i}" class="slidecontainer" style="display:none; padding-top:3em; width:90vw; align-items:center;">
              <div style="display:grid; display:grid; grid-template-rows:2em; grid-template-columns:1fr 70% 1fr; flex:1;">
                  <div style="text-align:right; margin-right:1em;">
                    <span style="vertical-align:sub;">${left_word}</span>
                  </div>
                <div style="position:relative; display:flex; align-items:center; height:100%;">
                  <div style="position:absolute; width:100%; height:100%; display:flex; align-items:center;">
                    <input type="range" min="${trial.min}" max="${trial.max}" value="${trial.default}" class="slider" id="plugin-slider-${i}" style="width:100%;">
                  </div>
                  <div style="position:absolute; width:100%;">
                    <div id="plugin-label-container-${i}" style="position:relative;">
                      <div id="plugin-label-${i}" style="position:absolute;left:50%;transform:translate(-50%,-50%);user-select:none;pointer-events: none;">${middle_word}</div>
                    </div>
                  </div>
                </div>
                  <div style="text-align:left; margin-left:1em;">
                    <span style="vertical-align:sub;">${right_word}</span>
                  </div>
              </div>
              <div id="plugin-label-${i}" style="display:flex; flex-direction:column; align-items:start; align-items:center;">
                <div style="display:flex; flex-direction:column; align-items:start;">
                  <label>
                    <input type="radio" id="plugin-no-move-${i}">
                    ${trial.no_move_label}
                  </label>
                  <label>
                    <input type="radio" id="plugin-move-${i}">
                    ${trial.move_label}
                  </label>
                </div>
              </div>
            </form>
      `,
        )
        .join('')}
        <div style="width:100%; display:flex; justify-content:center; padding:2em;">
          <input type="button" value="Continue" id="plugin-submit"  style="display:none; transform:translate(-50%);" />
        </div>
    `;

    const choices = Array(trial.words.length);
    const sliders = Array(trial.words.length);
    const rt = Array(trial.words.length);
    let currWordIndex = 0;
    let startTime = performance.now();

    const disableInputs = (i) => {
      document.getElementById(`plugin-no-move-${i}`).disabled = true;
      document.getElementById(`plugin-move-${i}`).disabled = true;
      document.getElementById(`plugin-slider-${i}`).disabled = true;
    };

    const styles = document.getElementById(`plugin-styles`);

    const unhideWord = (i) => {
      if (i < trial.words.length) {
        document.getElementById(`plugin-form-${i}`).style.display = 'flex';
        document.getElementById(`plugin-form-${i}`).scrollIntoView();
        styles.innerHTML += `
          #plugin-slider-${i}::-webkit-slider-thumb {
            width: ${document.getElementById(`plugin-label-${i}`).getBoundingClientRect().width +
              24}px;
          }
          
          #plugin-slider-${i}::-moz-range-thumb {
            width: ${document.getElementById(`plugin-label-${i}`).getBoundingClientRect().width +
              24}px;
          }
          
          #plugin-label-container-${i} {
            margin-left: ${(document.getElementById(`plugin-label-${i}`).getBoundingClientRect()
              .width +
              24) /
              2}px;
              margin-right: ${(document.getElementById(`plugin-label-${i}`).getBoundingClientRect()
                .width +
                24) /
                2}px;
          }
        `;
      } else {
        document.getElementById('plugin-submit').style.display = 'block';
        jsPsych.pluginAPI.clearAllTimeouts();
      }
    };

    document.getElementById('plugin-submit').onclick = () => {
      jsPsych.finishTrial({
        choices,
        sliders,
        rt,
      });
    };

    let currSecond = 0;
    const step = () => {
      currSecond++;
      document.getElementById('plugin-timer-bar').style.width = `${((trial.timer - currSecond) /
        trial.timer) *
        100}%`;
      document.getElementById('plugin-timer').textContent = trial.timer - currSecond;

      if (currSecond < trial.timer) {
        jsPsych.pluginAPI.setTimeout(step, 1000);
      } else {
        // disableInputs(currWordIndex);
        // document.getElementById('plugin-submit').style.display = 'block';

        disableInputs(currWordIndex);
        choices[currWordIndex] = null;
        sliders[currWordIndex] = document.getElementById(`plugin-slider-${currWordIndex}`).value;
        currWordIndex++;
        unhideWord(currWordIndex);
        const endTime = performance.now();
        rt[currWordIndex] = endTime - startTime;
        startTime = performance.now();

        if (currWordIndex < trial.words.length) {
          currSecond = 0;
          document.getElementById('plugin-timer-bar').style.width = `${((trial.timer - currSecond) /
            trial.timer) *
            100}%`;
          document.getElementById('plugin-timer').textContent = trial.timer - currSecond;
          jsPsych.pluginAPI.setTimeout(step, 1000);
        }
      }
    };
    jsPsych.pluginAPI.setTimeout(step, 1000);

    unhideWord(currWordIndex);
    trial.words.forEach((_, index) => {
      let i = index;
      document.getElementById(`plugin-slider-${i}`).oninput = (e) => {
        document.getElementById(`plugin-label-${i}`).style.left = `${((e.target.value - trial.min) /
          (trial.max - trial.min)) *
          100}%`;
      };
      document.getElementById(`plugin-no-move-${i}`).onchange = () => {
        jsPsych.pluginAPI.clearAllTimeouts();
        disableInputs(i);
        choices[i] = false;
        sliders[i] = document.getElementById(`plugin-slider-${i}`).value;
        currWordIndex++;
        unhideWord(currWordIndex);
        const endTime = performance.now();
        rt[i] = endTime - startTime;
        startTime = performance.now();

        if (currWordIndex < trial.words.length) {
          currSecond = 0;
          document.getElementById('plugin-timer-bar').style.width = `${((trial.timer - currSecond) /
            trial.timer) *
            100}%`;
          document.getElementById('plugin-timer').textContent = trial.timer - currSecond;
          jsPsych.pluginAPI.setTimeout(step, 1000);
        }
      };
      document.getElementById(`plugin-move-${i}`).onchange = () => {
        jsPsych.pluginAPI.clearAllTimeouts();
        disableInputs(i);
        choices[i] = true;
        sliders[i] = document.getElementById(`plugin-slider-${i}`).value;
        currWordIndex++;
        unhideWord(currWordIndex);
        const endTime = performance.now();
        rt[i] = endTime - startTime;
        startTime = performance.now();

        if (currWordIndex < trial.words.length) {
          currSecond = 0;
          document.getElementById('plugin-timer-bar').style.width = `${((trial.timer - currSecond) /
            trial.timer) *
            100}%`;
          document.getElementById('plugin-timer').textContent = trial.timer - currSecond;
          jsPsych.pluginAPI.setTimeout(step, 1000);
        }
      };
    });
  };

  return plugin;
})();
