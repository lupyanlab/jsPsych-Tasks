jsPsych.plugins['lupyanlab-survey-likert-skip'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-survey-likert-skip',
    description: 'survey-likert but with skip option',
    parameters: {
      questions: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        pretty_name: 'Questions',
        nested: {
          prompt: {
            type: jsPsych.plugins.parameterType.STRING,
            pretty_name: 'Prompt',
            default: undefined,
            description: 'Questions that are associated with the slider.',
          },
          labels: {
            type: jsPsych.plugins.parameterType.STRING,
            array: true,
            pretty_name: 'Labels',
            default: undefined,
            description: 'Labels to display for individual question.',
          },
          required: {
            type: jsPsych.plugins.parameterType.BOOL,
            pretty_name: 'Required',
            default: false,
            description: 'Makes answering questions required.',
          },
        },
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Preamble',
        default: null,
        description: 'String to display at top of the page.',
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button label',
        default: 'Continue',
        description: 'Label of the button.',
      },
      skip_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Skip label',
        default: 'Skip',
        description: 'Label to show above the skip button.',
      },
      skippable: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Skippable',
        default: true,
        description: 'Allow skipping.',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    let skipped = false;
    // TODO: If checkobx is checked, disable the questions.
    var html = '';
    // inject CSS for trial
    html += '<style id="jspsych-survey-likert-css">';
    html +=
      '.jspsych-survey-likert-statement { display:block; font-size: 16px; margin-bottom:10px; }' +
      '.jspsych-survey-likert-opts { list-style:none; width:100%; margin:0; padding:0 0 35px; display:block; font-size: 14px; line-height:1.1em; }' +
      '.jspsych-survey-likert-opt-label { line-height: 1.1em; color: #444; }' +
      ".jspsych-survey-likert-opts:before { content: ''; position:relative; top:11px; /*left:9.5%;*/ display:block; background-color:#efefef; height:4px; width:100%; }" +
      '.jspsych-survey-likert-opts:last-of-type { border-bottom: 0; }' +
      '.jspsych-survey-likert-opts li { display:inline-block; /*width:19%;*/ text-align:center; vertical-align: top; }' +
      '.jspsych-survey-likert-opts li input[type=radio] { display:block; position:relative; top:0; left:50%; margin-left:-6px; }';
    html += '</style>';

    // show preamble text
    if (trial.preamble !== null) {
      html +=
        '<div id="jspsych-survey-likert-preamble" class="jspsych-survey-likert-preamble">' +
        trial.preamble +
        '</div>';
    }
    html += '<form id="jspsych-survey-likert-form">';

    // add likert scale questions
    for (var i = 0; i < trial.questions.length; i++) {
      // add question
      html +=
        '<label class="jspsych-survey-likert-statement">' + trial.questions[i].prompt + '</label>';
      // add options
      var width = 100 / trial.questions[i].labels.length;
      var options_string = '<ul class="jspsych-survey-likert-opts" data-radio-group="Q' + i + '">';
      for (var j = 0; j < trial.questions[i].labels.length; j++) {
        options_string +=
          '<li style="width:' +
          width +
          '%"><input type="radio" name="Q' +
          i +
          '" value="' +
          j +
          '"';
        if (trial.questions[i].required) {
          options_string += ' required';
        }
        options_string +=
          '><label class="jspsych-survey-likert-opt-label">' +
          trial.questions[i].labels[j] +
          '</label></li>';
      }

      options_string += '</ul>';
      html += options_string;
    }

    if (trial.skippable) {
      // add submit button
      html += /*html*/ `
        <label class="jspsych-survey-likert-opt-label">${trial.skip_label}</label>
        <br>
        <input id="skip" class="jspsych-survey-likert jspsych-btn" style="width:auto" value=${trial.button_label}></input>
        `;
    }

    html += '</form>';

    var endTime;
    display_element.innerHTML = html;
    if (trial.skippable) {
      display_element.querySelector('#skip').addEventListener('click', function() {
        endTime = new Date().getTime();
        display_element.querySelectorAll('[type="radio"]').forEach((choiceEl) => {
          choiceEl.disabled = true;
        });
        this.disabled = true;
        skipped = true;
        setTimeout(
          () =>
            display_element
              .querySelector('#jspsych-survey-likert-form')
              .dispatchEvent(new Event('submit')),
          1000,
        );
      });
    }

    display_element.querySelector('.jspsych-survey-likert-opts').focus();
    display_element.querySelectorAll('[type="radio"]').forEach((choiceEl) => {
      choiceEl.addEventListener('click', () => {
        endTime = new Date().getTime();
        display_element.querySelectorAll('[type="radio"]').forEach((choiceEl) => {
          choiceEl.disabled = true;
        });
        if (trial.skippable) {
          display_element.querySelector('#skip').disabled = true;
        }
        setTimeout(
          () =>
            display_element
              .querySelector('#jspsych-survey-likert-form')
              .dispatchEvent(new Event('submit')),
          1000,
        );
      });
    });

    display_element
      .querySelector('#jspsych-survey-likert-form')
      .addEventListener('submit', function(e) {
        e.preventDefault();
        if (!endTime) {
          endTime = new Date().getTime();
        }
        // measure response time
        var response_time = endTime - startTime;

        // create object to hold responses
        var question_data = {};
        var matches = display_element.querySelectorAll(
          '#jspsych-survey-likert-form .jspsych-survey-likert-opts',
        );
        for (var index = 0; index < matches.length; index++) {
          var id = matches[index].dataset['radioGroup'];
          var el = display_element.querySelector('input[name="' + id + '"]:checked');
          if (el === null) {
            var response = '';
          } else {
            var response = parseInt(el.value);
          }
          var obje = {};
          obje[id] = response;
          Object.assign(question_data, obje);
        }

        // save data
        var trial_data = {
          rt: response_time,
          responses: !skipped
            ? JSON.stringify(question_data)
            : JSON.stringify(Object.keys(question_data).map(() => null)),
          skipped,
        };

        display_element.innerHTML = '';

        // next trial
        jsPsych.finishTrial(trial_data);
      });

    // function to handle responses by the subject
    var after_response = function(info) {
      // Ignore response if skipped checkbox is checked
      if (skipped) {
        return;
      }

      display_element
        .querySelectorAll('input[name=Q0]')
        [jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(info.key) - 1].click();
    };

    // start the response listener
    if (trial.choices != jsPsych.NO_KEYS) {
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: Array.from({ length: trial.questions[0].labels.length }, (v, k) =>
          String(k + 1),
        ),
        rt_method: 'date',
        persist: false,
        allow_held_key: false,
      });
    }

    var startTime = new Date().getTime();
  };

  return plugin;
})();
