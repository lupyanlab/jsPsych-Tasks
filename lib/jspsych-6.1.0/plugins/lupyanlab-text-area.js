jsPsych.plugins['lupyanlab-text-area'] = (function() {
  var plugin = {};
  jsPsych.pluginAPI.registerPreload('lupyanlab-text-area', 'stimulus', 'image');

  plugin.info = {
    name: 'lupyanlab-text-area',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE, // INT, IMAGE, KEYCODE, STRING, FUNCTION, FLOAT
        default_value: undefined,
      },
      question: {
        type: jsPsych.plugins.parameterType.STRING,
        default_value: undefined,
      },
      placeholder: {
        type: jsPsych.plugins.parameterType.STRING,
        default_value: '',
      },
      min_chars_required: {
        type: jsPsych.plugins.parameterType.INT,
        default_value: 0,
      },
      trim_response_string: {
        type: jsPsych.plugins.parameterType.BOOL,
        default_value: '',
      },
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    const padding = 4;
    display_element.innerHTML = /*html*/ `
      <h3>${trial.trial_progress_text}</h3>
      <img src="${trial.stimulus}" />
		  <div style="display: flex;flex-direction: column;align-items: center;">
			  <label for="response" style="margin-bottom:1em;">${trial.question}</label>
			  <input type="text" class="form-control" id="response" name="response" placeholder="${trial.placeholder}" class="response-text-area" style="padding:${padding}px;overflow:hidden;" autofocus />
		<br />
		<button id="submit-response-btn" class="btn btn-primary">Submit</button>
		  </div>
		  `;

    const response_text_area = document.querySelector('#response');
    response_text_area.addEventListener('keydown', function(event) {
      if (event.keyCode === 13) {
        let response = this.value;
        if (trial.trim_response_string) {
          response = response.trim();
        }
        if (response.length < trial.min_chars_required) {
          alert(`Please enter a response with ${trial.min_chars_required} or more letters.`);
          return;
        }
        const end_time = Date.now();
        const rt = end_time - start_time;
        const trial_data = {
          response,
          rt,
        };
        jsPsych.finishTrial(trial_data);
      }
    });
    // response_text_area.addEventListener("keydown", autosize);
    response_text_area.focus();

    function autosize() {
      // var el = this;
      // setTimeout(function() {
      //   el.style.cssText = "height:auto; padding:0";
      //   // for box-sizing other than "content-box" use:
      //   // el.style.cssText = '-moz-box-sizing:content-box';
      //   el.style.cssText = `height:${el.scrollHeight +
      //     padding * 2}px;padding:${padding}px;overflow:hidden;`;
      // }, 0);
    }

    const start_time = Date.now();
    document.querySelector('#submit-response-btn').addEventListener('click', function() {
      let response = response_text_area.value;
      if (trial.trim_response_string) {
        response = response.trim();
      }
      if (response.length < trial.min_chars_required) {
        alert(`Please enter a response with ${trial.min_chars_required} or more letters.`);
        return;
      }
      const end_time = Date.now();
      const rt = end_time - start_time;
      const trial_data = {
        response,
        rt,
      };
      jsPsych.finishTrial(trial_data);
    });
  };

  return plugin;
})();
