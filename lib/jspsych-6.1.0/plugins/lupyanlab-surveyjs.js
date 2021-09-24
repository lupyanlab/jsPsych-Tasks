/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-surveyjs'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'surveyjs',
    parameters: {
      questions: {
        type: jsPsych.plugins.parameterType.COMPLEX, // INT, IMAGE, KEYCODE, STRING, FUNCTION, FLOAT
        default_value: [],
      },
      properties: {
        type: jsPsych.plugins.parameterType.COMPLEX, // INT, IMAGE, KEYCODE, STRING, FUNCTION, FLOAT
        default_value: {},
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /* html */ `
    <div  class="survey">
	    <div id="surveyElement"></div>
    </div>`;

    const survey = new Survey.Model({
      questions: trial.questions,
    });

    Object.entries(trial.properties || {}).forEach(([key, value]) => {
      survey[key] = value;
    });

    survey.onComplete.add(function(result) {
      const demographics_responses = result.data;
      jsPsych.finishTrial({
        response: demographics_responses,
      });
    });

    $('#surveyElement').Survey({
      model: survey,
    });
    survey.showCompletedPage = false;
  };

  return plugin;
})();
