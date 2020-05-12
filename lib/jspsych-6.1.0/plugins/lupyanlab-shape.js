/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-shape'] = (function() {
  var plugin = {};

  jsPsych.pluginAPI.registerPreload('lupyanlab-shape', 'image', 'image');

  plugin.info = {
    name: 'lupyanlab-shape',
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
      image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Image',
        default: undefined,
        description: 'The image to be displayed',
      },
      image_height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image height',
        default: null,
        description: 'Set the image height in pixels',
      },
      image_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Image width',
        default: null,
        description: 'Set the image width in pixels',
      },
      score_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Score text',
        default: null,
        description: 'text to display for the score',
      },
      bonus_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Bonus text',
        default: null,
        description: 'text to display for the bonus',
      },
      input_placeholder: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Input placeholder',
        default: null,
        description: 'Text to display in the input placeholder',
      },
      submit_button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Submit button label',
        default: null,
        description: 'Text to display in button label',
      },
      input_feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Time for input feedback',
        default: null,
        description: 'Set the time for how long the input feedback lasts for.',
      },
      on_submit: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        pretty_name: 'On submit function',
        default: null,
        description: 'Function that returns a promise to be resolved.',
      },
      connection_outage_message: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Connection outage message',
        default: null,
        description: 'Text to display on an alert if on_submit cannot submit data to api',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /* html */ `
    <div style="display:flex; flex-direction:column; align-items:center; width:90vw; height:90vh;">
      <style>
        #plugin-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-right: auto;
          font-weight: bolder;
          color: steelblue;
        }

        #plugin-response {
          background-color: dodgerblue;
          color: white;
          border-radius: 1em;
          font-size: 1em;
          padding: 0.25em 0.5em 0.25em 0.5em;
          border: solid lightcyan 0.1em;
          outline: none;
          font-family: Arial;
        }

        #plugin-response::placeholder {
          color: powderblue;
        }

        #plugin-response[disabled] {
          opacity: 0.6;
        }

        #plugin-submit {
          background-color: dodgerblue;
          color: white;
          border-radius: 1em;
          font-weight: bold;
          padding: 0.5em 1em 0.5em 1em;
          border: solid lightcyan 0.1em;
          cursor: pointer;
          font-family: Arial;
        }

        #plugin-submit[disabled] {
          cursor: default;
          opacity: 0.6;
        }

        #plugin-trial-text {
          font-weight: bolder;
        }
      </style>
      <div style="display:flex; width:100%;">
        <div id="plugin-header">
          <div>${trial.score_text}</div>
          <div>${trial.bonus_text}</div>
        </div>
        ${
          trial.trial_progress_text !== null
            ? /* html */ `<div id="plugin-trial-text">${trial.trial_progress_text}`
            : ''
        }</div>
      </div>
      ${trial.prompt !== null ? /* html */ `<h2>${trial.prompt}</h2>` : ''}
      <form id="plugin-form" style="display:flex;">
        <input type="text" id="plugin-response" placeholder="${trial.input_placeholder}" required />
        <button id="plugin-submit">${trial.submit_button_label}</button>
      </form>
      <img src="${trial.image}" height="${
      trial.image_height === null ? 'auto' : trial.image_height + 'px'
    }"/>
    </div>
    `;
    const startTime = performance.now();

    const end_trial = (response) => {
      if (response.trim().length == 0) {
        return;
      }
      document.getElementById('plugin-response').disabled = true;
      document.getElementById('plugin-submit').disabled = true;
      const endTime = performance.now();
      const rt = endTime - startTime;

      const trial_data = {
        rt: rt,
        response: response,
      };

      // Wait for at least the feedback duration
      // and for the on_submit function to resolve
      Promise.all([
        new Promise((resolve) => {
          setTimeout(resolve, trial.input_feedback_duration);
        }),
        trial.on_submit(trial_data),
      ])
        .then(() => {
          jsPsych.finishTrial(trial_data);
        })
        .catch(() => {
          alert(trial.connection_outage_message);
        });
    };

    document.getElementById('plugin-response').focus();
    document
      .getElementById('plugin-submit')
      .addEventListener('click', () => end_trial(document.getElementById('plugin-response').value));

    document.getElementById('plugin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      document.getElementById('plugin-response').value;
    });
  };

  return plugin;
})();
