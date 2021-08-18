/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-matcher'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-matcher',
    parameters: {
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Trial progress text',
        default: null,
        description: 'Text to display below progress bar',
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Prompt to display above the image',
      },
      submit_button_text: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Submit',
      },
      terms: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        default: undefined,
      },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Time for input feedback',
        default: 0,
        description: 'Set the time for how long the input feedback lasts for.',
      },
      no_cell_selected_message: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'At least one cell must be selected.',
      },
      instructions: {
        type: jsPsych.plugins.parameterType.STRING,
        default: null,
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /* html */ `
    <style>
      .plugin-square {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: white;
        cursor: pointer;
      }
      .plugin-square:after {
        content: "";
        display: block;
        padding-bottom: 100%;
      }
      .plugin-content {
        position: absolute;
      }
      @media only screen and (max-width:600px)  { 
        /* smartphones, iPhone, portrait 480x320 phones */ 
        .plugin-content {
          font-size: 0.6em;
        }
      }

      </style>
    <div style="display:flex; flex-direction:column; align-items:center;">
      ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
      <div id="plugin-grid" style="display:grid; width:80vw; max-width:50vh; grid-template-rows:1fr 1fr 1fr; grid-template-columns:1fr 1fr 1fr; border:3px solid black; grid-gap:3px; background-color:black;">
        ${trial.terms
          .map(
            (term, index) =>
              /* html */ `<div class="plugin-term plugin-square" index="${index}"><div class="plugin-content" >${term}</div></div>`,
          )
          .join('')}
      </div>
      ${trial.prompt !== null ? /* html */ `<h3>${trial.prompt}</h3>` : ''}
      ${trial.instructions !== null ? /* html */ `<p>${trial.instructions}</p>` : ''}
      <form id="plugin-form">
        <input type="submit" value="${trial.submit_button_text}" />
      </form>
    </div>
    `;
    const widestTextWidth = [...document.querySelectorAll('.plugin-content')].reduce(
      (acc, node) => Math.max(acc, node.getBoundingClientRect().width),
      0,
    );
    const pluginGridWidth = document.getElementById('plugin-grid').getBoundingClientRect().width;

    if (widestTextWidth > pluginGridWidth / 3) {
      document.getElementById('plugin-grid').style.width = `${widestTextWidth * 3 + 100}px`;
      document.getElementById('plugin-grid').style.maxWidth = 'unset';
    }

    const startTime = performance.now();

    const form_element = document.getElementById('plugin-form');
    const response = [false, false, false, false, false, false, false, false, false];
    display_element.querySelectorAll('.plugin-term').forEach((el) => {
      el.onclick = () => {
        const index = Number(el.getAttribute('index'));
        response[index] = !response[index];

        if (response[index]) {
          el.style.backgroundColor = 'yellow';
        } else {
          el.style.backgroundColor = 'white';
        }
      };
    });

    form_element.onsubmit = (e) => {
      e.preventDefault();
      if (response.every((cell) => cell === false)) {
        alert(trial.no_cell_selected_message);
        return;
      }
      form_element.querySelector('[type="submit"]').disabled = true;
      const endTime = performance.now();
      const rt = endTime - startTime;

      const trial_data = {
        rt: rt,
        response: response,
      };

      jsPsych.pluginAPI.setTimeout(function() {
        jsPsych.finishTrial(trial_data);
      }, trial.feedback_duration);
    };
  };

  return plugin;
})();
