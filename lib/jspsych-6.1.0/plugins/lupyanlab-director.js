/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-director'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-director',
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
        type: jsPsych.plugins.parameterType.COMPLEX, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        array: true,
        nested: {
          target: {
            type: jsPsych.plugins.parameterType.BOOL,
            default: undefined,
          },
          value: {
            type: jsPsych.plugins.parameterType.STRING,
            default: undefined,
          },
        },
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /* html */ `
    <style>
      .plugin-tile {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .plugin-content {
        position: absolute;
        font-size: 1em;
      }
      </style>
    <div style="display:flex; flex-direction:column; align-items:center;">
      ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
      <div style="display:grid; width:70vw; height:70vh; grid-template-rows:1fr 1fr 1fr; grid-template-columns:1fr 1fr 1fr; border:3px solid black; grid-gap:3px; background-color:black;">
        ${trial.terms
          .map(
            (term) =>
              /* html */ `<div class="plugin-tile" style="background-color:${
                term.target ? 'yellow' : 'white'
              };"><div class="plugin-content" >${term.value}</div></div>`,
          )
          .join('')}
      </div>
      ${trial.prompt !== null ? /* html */ `<h3>${trial.prompt}</h3>` : ''}
      <form id="plugin-form">
        <input id="plugin-response" required autofocus type="text" />
        <input type="submit" value="${trial.submit_button_text}" />
      </form>
    </div>
    `;
    const startTime = performance.now();

    const response_element = document.getElementById('plugin-response');
    response_element.focus();
    const form_element = document.getElementById('plugin-form');

    form_element.onsubmit = (e) => {
      e.preventDefault();
      const endTime = performance.now();
      const rt = endTime - startTime;

      const trial_data = {
        rt: rt,
        response: response_element.value,
      };

      jsPsych.finishTrial(trial_data);
    };
  };

  return plugin;
})();
