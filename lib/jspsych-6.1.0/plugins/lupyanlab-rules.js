/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-rules'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-rules',
    parameters: {
      stims_to_sort_l: {
        type: jsPsych.plugins.parameterType.IMAGE, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      stims_to_sort_r: {
        type: jsPsych.plugins.parameterType.IMAGE,
        default: undefined,
      },
      placeholder_l: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      placeholder_r: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      submit_button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      prompt_l: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      prmopot_r: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
    <form class="content vw-90" id="plugin-form">
        <div class="row justify-content-around">
          <div class="col d-flex flex-column align-items-center">
            <div class="border border-primary p-3 m-3 d-flex flex-column align-items-center">
              <h2>${trial.prompt_l}</h2>
              <div class="" style="display:grid; grid-template-rows: 1fr 1fr 1fr; grid-template-columns: 1fr 1fr 1fr; width:40vw; max-width:60vh; height:60vh; max-height:40vw;">
                ${trial.stims_to_sort_l
                  .map(
                    (stim, i) => /*html*/ `
                      <div>
                        <img src="${stim}" class="w-100 h-100" />
                      </div>
                  `,
                  )
                  .join('')}
              </div>
            </div>
            <textarea required type="text" class="form-control w-75" rows="4" cols="100" placeholder="${
              trial.placeholder_l
            }" id="plugin-l"></textarea>
          </div>
          <div class="col d-flex flex-column align-items-center">
            <div class="border border-primary p-3 m-3 d-flex flex-column align-items-center">
              <h2>${trial.prompt_r}</h2>
              <div class="" style="display:grid; grid-template-rows: 1fr 1fr 1fr; grid-template-columns: 1fr 1fr 1fr; width:40vw; max-width:60vh; height:60vh; max-height:40vw;">
                ${trial.stims_to_sort_r
                  .map(
                    (stim, i) => /*html*/ `
                      <div>
                        <img src="${stim}" class="w-100 h-100" />
                      </div>
                  `,
                  )
                  .join('')}
                </div>
            </div>
            <textarea required type="text" class="form-control w-75" rows="4" cols="100" placeholder="${
              trial.placeholder_r
            }" id="plugin-r"></textarea>
          </div>
        </div>
        <input type="submit" value="${trial.submit_button_label}" id="plugin-submit" />
      </form>
    `;
    const start_time = performance.now();

    document.querySelector('#plugin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const response_l = document.querySelector('#plugin-l').value;
      const response_r = document.querySelector('#plugin-r').value;

      const end_time = performance.now();
      const rt = end_time - start_time;

      const trial_data = {
        response_l,
        response_r,
        rt,
      };

      jsPsych.finishTrial(trial_data);
    });
  };

  return plugin;
})();
