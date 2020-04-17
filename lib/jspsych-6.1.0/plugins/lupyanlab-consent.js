/** (July 2012, Erik Weitnauer)
The html-plugin will load and display an external html pages. To proceed to the next, the
user might either press a button on the page or a specific key. Afterwards, the page get hidden and
the plugin will wait of a specified time before it proceeds.

documentation: docs.jspsych.org
*/
jsPsych.plugins['lupyanlab-consent'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-consent',
    description: '',
    parameters: {
      welcome: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Welcome',
        default: null,
        description: 'Welcome content.',
      },
      consent: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Consent',
        default: null,
        description: 'Consent to display above the consent checkbox.',
      },
      alert: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Alert content',
        default: null,
        description: 'Alert content to display if continue button is clicked without consnet.',
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Start button label',
        default: null,
        description: 'Label for start button.',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
      <p class="lead">${trial.welcome}</p>
      <p class="lead">${trial.consent}</p>
      <p>
        <label>
          ${trial.checkbox_label}
          <input type="checkbox" id="plugin-checkbox" />
        </label>
      </p>
      <button type="button" class="btn btn-primary" id="plugin-start">${trial.button_label}</button>
    `;

    var t0 = performance.now();

    var finish = function() {
      if (!document.getElementById('plugin-checkbox').checked) {
        alert(trial.alert);
        return;
      }
      var trial_data = {
        rt: performance.now() - t0,
        url: trial.url,
      };
      display_element.innerHTML = '';
      jsPsych.finishTrial(trial_data);
    };

    document.getElementById('plugin-start').addEventListener('click', finish);
  };

  return plugin;
})();
