/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-shape-descriptions'] = (function() {
  const plugin = {};

  jsPsych.pluginAPI.registerPreload('lupyanlab-shape-descriptions', 'stims', 'image');

  plugin.info = {
    name: 'lupyanlab-shape-descriptions',
    parameters: {
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      stim_size: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 100,
      },
      stimuli: {
        type: jsPsych.plugins.parameterType.COMPLEX, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      stim_not_moved_alert: {
        type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      finish_button_label: {
        type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      left: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      right: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
      <style>
        .draggable {
          touch-action: none;
          z-index: 10000;
        }

        #plugin-container {
          display:grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: auto minmax(70vh,max-content);
          grid-template-areas:
            "left-header mid right-header"
            "left mid right"
        }
      </style>
      <h3>${trial.trial_progress_text}</h3>
      <div style="position:relative;width:100%;">
        <div id="plugin-container" style="width:100%; height:100%;">
          <div id="plugin-left-header" style="grid-area:left-header; border-right:solid;border-width:thick;">
            <h3>${trial.left}</h3>
          </div>
          <div style="grid-area:mid-header;">
          </div>
          <div id="plugin-right-header" style="grid-area:right-header; border-left:solid;border-width:thick;">
            <h3>${trial.right}</h3>
          </div>
          <div id="plugin-left" style="grid-area:left; border-right:solid;border-width:thick;">
          </div>
          <div style="grid-area:mid; display:flex; flex-direction:row; justify-content:center; align-items:center; flex-wrap: wrap; align-self:center; ">
            ${trial.stimuli
              .map(
                (stim) => /*html*/ `
                <img class="draggable" src="${stim}" style="width:${trial.stim_size}px" />
              `,
              )
              .join('')}
          </div>
          <div id="plugin-right" style="grid-area:right; border-left:solid;border-width:thick;">
          </div>
        </div>
        <input id="plugin-done" type="button" style="position:absolute; bottom:0; right:0;" value="${
          trial.finish_button_label
        }" />
      </div>
    `;

    let stim_infos = {};
    const start_time = performance.now();
    const window_width = window.innerWidth;
    const window_height = window.innerHeight;

    const left = document.getElementById('plugin-left');
    const right = document.getElementById('plugin-right');
    const left_header = document.getElementById('plugin-left-header');
    const right_header = document.getElementById('plugin-right-header');

    function stim_to_name(stim) {
      return stim.split('/')[stim.split('/').length - 1];
    }

    interact('.draggable').draggable({
      modifiers: [interact.modifiers.restrictRect({})],
      autoScroll: true,
      listeners: {
        // call this function on every dragmove event
        move: dragMoveListener,

        // call this function on every dragend event
        end(event) {
          left.style.borderColor = 'black';
          left_header.style.borderColor = 'black';
          right.style.borderColor = 'black';
          right_header.style.borderColor = 'black';
          const rect = event.target.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const stim_name = event.target.getAttribute('src').split('/')[
            event.target.getAttribute('src').split('/').length - 1
          ];

          const leftMaxX = left.getBoundingClientRect().x + left.getBoundingClientRect().width;
          const rightMinX = right.getBoundingClientRect().x;
          const stim_info = {
            ...stim_infos[stim_name],
            x,
            y,
          };

          if (x <= leftMaxX) {
            stim_info.side = 'left';
          } else if (x >= rightMinX) {
            stim_info.side = 'right';
          } else {
            stim_info.side = undefined;
          }

          stim_infos = {
            ...stim_infos,
            [stim_name]: stim_info,
          };
        },
      },
    });

    function dragMoveListener(event) {
      const target = event.target;

      const rect = event.target.getBoundingClientRect();
      const shape_x = rect.left + rect.width / 2;

      const leftMaxX = left.getBoundingClientRect().x + left.getBoundingClientRect().width;
      const rightMinX = right.getBoundingClientRect().x;

      if (shape_x <= leftMaxX) {
        left.style.borderColor = 'green';
        left_header.style.borderColor = 'green';
      } else {
        left.style.borderColor = 'black';
        left_header.style.borderColor = 'black';
      }

      if (shape_x >= rightMinX) {
        right.style.borderColor = 'green';
        right_header.style.borderColor = 'green';
      } else {
        right.style.borderColor = 'black';
        right_header.style.borderColor = 'black';
      }

      // keep the dragged position in the data-x/data-y attributes
      const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
      const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
      // translate the element
      target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

      // update the posiion attributes
      target.setAttribute('data-x', x);
      target.setAttribute('data-y', y);
    }

    document.querySelector('#plugin-done').addEventListener('click', () => {
      const movedEveryObject = trial.stimuli
        .map(stim_to_name)
        .every((stim) => stim in stim_infos && stim_infos[stim].side !== undefined);
      if (!movedEveryObject) {
        alert(trial.stim_not_moved_alert);
        return;
      }

      const end_time = performance.now();
      const rt = end_time - start_time;

      jsPsych.finishTrial({
        rt,
        window_width,
        window_height,
        stim_infos,
      });
    });
  };

  return plugin;
})();
