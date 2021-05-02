jsPsych.plugins['lupyanlab-image-scale'] = (function() {
  var plugin = {};
  jsPsych.pluginAPI.registerPreload('lupyanlab-image-scale', 'stimulus', 'image');

  plugin.info = {
    name: 'lupyanlab-image-scale',
    parameters: {
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Trial progress text',
        default: null,
        description: 'Text to display below progress bar',
      },
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE, // INT, IMAGE, KEYCODE, STRING, FUNCTION, FLOAT
        default_value: undefined,
      },
      question: {
        type: jsPsych.plugins.parameterType.STRING,
        default_value: undefined,
      },
      choices: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        pretty_name: 'Choices',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <h3>${trial.trial_progress_text}</h3>
        <img src="${trial.stimulus}" />
        <form id="plugin-form" style="display: flex;flex-direction: column;align-items: center;">
          <label for="response" style="margin-bottom:1em;">${trial.question}</label>
          <div style="display:grid; grid-template-columns:${trial.choices
            .map(() => '1fr')
            .join(' ')}">
            ${trial.choices
              .map(
                (choice, index) => /*html*/ `
                  <label style="padding:1em; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <input value="${index}" type="radio" class="plugin-radio" name="plugin-radio" required />
                    ${choice}
                  </label>
                  `,
              )
              .join('')}
            </div>
          <br />
          <button id="submit-response-btn" type="submit" class="btn btn-primary">Submit</button>
        </form>
      </div>
		  `;

    const start_time = Date.now();
    display_element.querySelector('#plugin-form').onsubmit = (e) => {
      e.preventDefault();
      const index = Number(
        display_element.querySelector('input[name="plugin-radio"]:checked').value,
      );

      const end_time = Date.now();
      const rt = end_time - start_time;
      const trial_data = {
        response: index + 1,
        rt,
      };
      jsPsych.finishTrial(trial_data);
    };
  };

  return plugin;
})();
