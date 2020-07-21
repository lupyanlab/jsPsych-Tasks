/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-image-similarity'] = (function() {
  var plugin = {};

  jsPsych.pluginAPI.registerPreload('lupyanlab-image-similarity', 'left_image', 'image');
  jsPsych.pluginAPI.registerPreload('lupyanlab-image-similarity', 'right_image', 'image');

  plugin.info = {
    name: 'lupyanlab-image-similarity',
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
      left_image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Left Image',
        default: undefined,
        description: 'The image to be displayed on the left',
      },
      right_image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Right Image',
        default: undefined,
        description: 'The image to be displayed on the right',
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
      keys: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        pretty_name: 'Choice keys',
        default: undefined,
        description: 'The keys the subject is allowed to press to respond to the image.',
      },
      labels: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        pretty_name: 'Choice lables',
        default: undefined,
        description: 'The labels the subject is allowed to press to respond to the image.',
      },
      input_feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Time for input feedback',
        default: null,
        description: 'Set the time for how long the input feedback lasts for.',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /* html */ `
    <div style="display:flex; flex-direction:column; align-items:center;">
      ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
      ${trial.prompt !== null ? /* html */ `<h1>${trial.prompt}</h1>` : ''}
      <div>
        <img src="${trial.left_image}" height="${
      trial.image_height === null ? 'auto' : trial.image_height + 'px'
    }" style="margin:1em;"/>
        <img src="${trial.right_image}" height="${
      trial.image_height === null ? 'auto' : trial.image_height + 'px'
    }" style="margin:1em;"/>
      </div>
      <div style="display:grid; width:max-content; grid-template-columns:${trial.keys
        .map(() => '1fr')
        .join(' ')}">
        ${trial.keys
          .map(
            (key, i) => /* html */ `
            <div style="display:flex; flex-direction:column; justify-content:flex-end; align-items:center">
              <input type="radio" id="plugin-radio-${key}" name="${trial.labels[i]}" value="${key}" />
              <label for="plugin-radio-${key}">${trial.labels[i]}</label>
            </div>
          `,
          )
          .join('')}
      </div>
    </div>
    `;
    const startTime = performance.now();

    const choice_elements = trial.keys.map((key) => document.getElementById(`plugin-radio-${key}`));

    const end_trial = (selected_key) => {
      choice_elements.forEach((choice_element) => (choice_element.disable = true));
      const endTime = performance.now();
      const rt = endTime - startTime;
      const selected_label = trial.labels[selected_key];

      const trial_data = {
        rt: rt,
        key: selected_key,
        label: selected_label,
      };

      setTimeout(() => {
        jsPsych.finishTrial(trial_data);
      }, trial.input_feedback_duration);
    };

    choice_elements.forEach((choiceRadioEl) => {
      choiceRadioEl.addEventListener('click', () => end_trial(choiceRadioEl.value));
    });

    jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: ({ key: keyCode }) => {
        const key = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(keyCode);
        document.getElementById(`plugin-radio-${key}`).checked = true;
        document.getElementById(`plugin-radio-${key}`).dispatchEvent(new Event('click'));
      },
      valid_responses: trial.keys.map((key) =>
        jsPsych.pluginAPI.convertKeyCharacterToKeyCode(String(key)),
      ),
      rt_method: 'performance',
      persist: false,
      allow_held_key: false,
    });
  };

  return plugin;
})();
