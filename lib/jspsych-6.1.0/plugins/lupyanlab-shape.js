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
    <div style="display:flex; flex-direction:column; align-items:center;">
      ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
      <div style="display:flex; flex-direction:column; align-items:flex-start;">
        <div>${trial.score_text}</div>
        <div>${trial.bonus_text}</div>
      </div>
      ${trial.prompt !== null ? /* html */ `<h1>${trial.prompt}</h1>` : ''}
      <form id="plugin-form" style="display:grid;">
        <input id="plugin-response" placeholder="${trial.input_placeholder}" />
        <button id="plugin-submit">${trial.submit_button_label}</button>
      </div>
      <img src="${trial.image}" height="${
      trial.image_height === null ? 'auto' : trial.image_height + 'px'
    }" style="margin:2em;"/>
    </div>
    `;
    const startTime = performance.now();

    const end_trial = (response) => {
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
