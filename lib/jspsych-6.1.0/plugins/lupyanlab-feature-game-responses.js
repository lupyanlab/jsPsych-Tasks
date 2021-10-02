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
      min_character_count: {
        type: jsPsych.plugins.parameterType.INT,
        default: 3,
      },
      max_word_count: {
        type: jsPsych.plugins.parameterType.INT,
        default: 5,
      },
      error_count_message: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'At least one response is too short or is too long.',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /* html */ `
    <style>
      .button {
        background-color: green; /* Green */
        border: none;
        color: white;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 2em;
        cursor: pointer;
        font-weight: bold;
      }
      #plugin-content {
        border-width: 0.2em;
        border-color: green;
        border-style: solid;
        padding: 0.1em;
      }
    </style>
    <div style="display:flex; flex-direction:column; align-items:center;">
      ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
      <h1 id="plugin-content" >${trial.stim}</h1>
      <form id="plugin-form" style="display:grid; grid-template-columns:1fr 1fr 1fr;">
        <div></div>
        <div>
          <div style="display:flex; flex-direction:column; align-items:center;">
            ${[...Array(trial.num_responses).keys()]
              .map(
                (i) =>
                  /*html*/ `<div style="height:1em;"></div><input id="plugin-response-${i}" required type="text" style="border-style:dotted; border-width:0.2em; width:10em; text-align:center; font-size:1.5em; padding:0.1em;" />`,
              )
              .join('')}
          </div>
        </div>
        <div>
          <div style="width:2em;"></div>
          <div style="height:100%; display:flex; justify-content:center; align-items:center;">
            <input class="button" type="submit" value="${trial.next_button_text}"></div>
          </div>
        </div>
      </form>
      <div id="plugin-error" style="color:red;"></div>
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
      const responses = [...Array(trial.num_responses).keys()]
        .map((i) => document.getElementById(`plugin-response-${i}`))
        .map((response_element) => response_element.value);
      if (
        responses.some(
          (response) =>
            response.trim().length < trial.min_character_count ||
            response.trim().split(' ').length > trial.max_word_count,
        )
      ) {
        document.getElementById('plugin-error').innerHTML = trial.error_count_message;
        return;
      }
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
