/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-feature-game-responses'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-feature-game-responses',
    parameters: {
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Trial progress text',
        default: null,
        description: 'Text to display below progress bar',
      },
      stim: {
        type: jsPsych.plugins.parameterType.STRING,
        default: null,
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Prompt to display above the image',
      },
      next_button_text: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Submit',
      },
      num_responses: {
        type: jsPsych.plugins.parameterType.INT,
        default: 4,
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /* html */ `
    <style>
      </style>
    <div style="display:flex; flex-direction:column; align-items:center;">
      ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
      <h1 class="plugin-content" >${trial.stim}</h1>
      <form id="plugin-form" style="display:flex; flex-direction:row; align-items:center;">
        <div style="display:flex; flex-direction:column; align-items:center;">
          ${[...Array(trial.num_responses).keys()]
            .map((i) => /*html*/ `<input id="plugin-response-${i}" required type="text" />`)
            .join('')}
        </div>
        <input type="submit" value="${trial.next_button_text}" />
      </form>
      ${trial.prompt !== null ? /* html */ `<h3>${trial.prompt}</h3>` : ''}
      <div id="plugin-error" style="color:red;"></div>
    </div>
    `;
    const startTime = performance.now();

    const response_element = document.getElementById('plugin-response-0');
    response_element.focus();
    const form_element = document.getElementById('plugin-form');

    form_element.onsubmit = (e) => {
      e.preventDefault();
      const responses = [...Array(trial.num_inputs).keys()]
        .map((i) => document.getElementById(`plugin-response-${i}`))
        .map((response_element) => response_element.value);

      const endTime = performance.now();
      const rt = endTime - startTime;

      const trial_data = {
        rt: rt,
        responses: responses,
      };

      jsPsych.finishTrial(trial_data);
    };
  };

  return plugin;
})();
