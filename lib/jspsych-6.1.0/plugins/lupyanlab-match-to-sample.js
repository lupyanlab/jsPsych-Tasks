jsPsych.plugins['lupyanlab-match-to-sample'] = (function() {
  var plugin = {};

  jsPsych.pluginAPI.registerPreload('lupyanlab-match-to-sample', 'sample_image', 'image');
  jsPsych.pluginAPI.registerPreload('lupyanlab-match-to-sample', 'left_image', 'image');
  jsPsych.pluginAPI.registerPreload('lupyanlab-match-to-sample', 'right_image', 'image');

  jsPsych.pluginAPI.registerPreload('lupyanlab-match-to-sample', 'incorrect_sound', 'audio');
  jsPsych.pluginAPI.registerPreload('lupyanlab-match-to-sample', 'sample_sound', 'audio');

  plugin.info = {
    name: 'lupyanlab-match-to-sample',
    parameters: {
      before_sample_delay_duration: {
        type: jsPsych.plugins.parameterType.INT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      sample_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      after_sample_delay_duration: {
        type: jsPsych.plugins.parameterType.INT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      sample_image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        default: null,
      },
      left_image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        default: null,
      },
      right_image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        default: null,
      },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Trial progress text',
        default: null,
        description: 'Text to display below progress bar',
      },
      incorrect_sound: {
        type: jsPsych.plugins.parameterType.AUDIO,
        default: undefined,
      },
      sample_sound: {
        type: jsPsych.plugins.parameterType.AUDIO,
        default: undefined,
      },
      left_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        default: undefined,
      },
      right_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        default: undefined,
      },
      audio_check: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: undefined,
      },
      audio_check_prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = trial.audio_check
      ? /*html*/ `
          <form id="plugin-audio-check-form">
            <label>
              <h1>${trial.audio_check_prompt}</h1>
              <input required type="text" id="audio-check-response" />
              <input type="submit" value="Submit"/>
            </label>
          </form>
        `
      : /*html*/ `
          <h3>${trial.trial_progress_text}</h3>
          <div style="display:flex; flex-direction:column; align-items:center; background-color:gray;">
            <div style="display:flex;">
              <div style=" margin:1.5em; background-color:white;">
                <img id="plugin-sample" src="${trial.sample_image}" style="opacity:0; width:30vw;  max-width:30vh; height:30vh; max-height:30vw;"/>
              </div>
            </div>
            <div style="display:flex;">
              <div style=" margin:1.5em; background-color:white;">
                <img id="plugin-left" src="${trial.left_image}" style="opacity:0; width:30vw; max-width:30vh; height:30vh; max-height:30vw;"/>
              </div>
              <div style=" margin:1.5em; background-color:white;;">
                <img id="plugin-right" src="${trial.right_image}" style="opacity:0; width:30vw;  max-width:30vh; height:30vh; max-height:30vw;"/>
              </div>
            </div>
          </div>
        `;

    function playSound(sound) {
      const context = jsPsych.pluginAPI.audioContext();
      const source = context.createBufferSource();
      source.connect(context.destination);
      source.buffer = jsPsych.pluginAPI.getAudioBuffer(sound);
      source.start(context.currentTime);
    }

    if (trial.audio_check) {
      const start_time = performance.now();
      playSound(trial.sample_sound);
      document.querySelector('#plugin-audio-check-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const end_time = performance.now();
        const rt = end_time - start_time;

        const response = document.querySelector('#audio-check-response').value;
        const trial_data = {
          rt,
          is_correct: 'NA',
          response,
        };
        jsPsych.finishTrial(trial_data);
      });
    } else {
      const showImage = (id, show) =>
        (document.querySelector(`#${id}`).style.opacity = show ? 1 : 0);

      (async () => {
        await new Promise((resolve) =>
          jsPsych.pluginAPI.setTimeout(resolve, trial.before_sample_delay_duration),
        );

        playSound(trial.sample_sound);
        showImage('plugin-sample', true);

        await new Promise((resolve) =>
          jsPsych.pluginAPI.setTimeout(resolve, trial.sample_duration),
        );

        showImage('plugin-sample', false);

        await new Promise((resolve) =>
          jsPsych.pluginAPI.setTimeout(resolve, trial.after_sample_delay_duration),
        );

        showImage('plugin-left', true);
        showImage('plugin-right', true);

        const { key, rt } = await new Promise((resolve) =>
          jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: resolve,
            valid_responses: [
              jsPsych.pluginAPI.convertKeyCharacterToKeyCode(trial.left_key),
              jsPsych.pluginAPI.convertKeyCharacterToKeyCode(trial.right_key),
            ],
            rt_method: 'performance',
            persist: false,
            allow_held_key: false,
          }),
        );

        const is_sample_on_left = trial.left_image === trial.sample_image;
        const is_left_key_pressed =
          jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(key) === trial.left_key;
        const is_correct =
          (is_sample_on_left && is_left_key_pressed) ||
          (!is_sample_on_left && !is_left_key_pressed);
        if (!is_correct) {
          playSound(trial.incorrect_sound);
        }

        await new Promise((resolve) =>
          jsPsych.pluginAPI.setTimeout(resolve, trial.feedback_duration),
        );

        const trial_data = {
          rt,
          response: jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(key),
        };

        jsPsych.finishTrial(trial_data);
      })();
    }
  };

  return plugin;
})();
