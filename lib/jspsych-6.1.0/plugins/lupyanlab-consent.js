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
      url: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'URL',
        default: undefined,
        description: 'The url of the external html page',
      },
      alert: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Alert content',
        default: null,
        description:
          'Alert content to display if continue button is clicked without the consent checked.',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = '';

    load(display_element, trial.url, function() {
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
    });

    // helper to load via XMLHttpRequest
    function load(element, file, callback) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open('GET', file, true);
      xmlhttp.onload = function() {
        if (xmlhttp.status == 200 || xmlhttp.status == 0) {
          //Check if loaded
          element.innerHTML = xmlhttp.responseText;
          callback();
        }
      };
      xmlhttp.send();
    }
  };

  return plugin;
})();
