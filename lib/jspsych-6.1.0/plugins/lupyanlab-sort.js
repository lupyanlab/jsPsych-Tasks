/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-sort'] = (function() {
  const plugin = {};

  jsPsych.pluginAPI.registerPreload('lupyanlab-sort', 'stims', 'image');

  plugin.info = {
    name: 'lupyanlab-sort',
    parameters: {
      stim_size: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 100,
      },
      left_stims: {
        type: jsPsych.plugins.parameterType.COMPLEX, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      top_stims: {
        type: jsPsych.plugins.parameterType.COMPLEX, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      right_stims: {
        type: jsPsych.plugins.parameterType.COMPLEX, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      bottom_stims: {
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
          grid-template-columns: auto auto auto;
          grid-template-rows: auto auto auto;
          grid-template-areas:
            ". top ."
            "left . right"
            ". bottom .";
        }
      </style>
      <div style="position:relative;width:${0.9 * window.innerWidth}px;height:${0.9 *
      window.innerHeight}px;">
        <div id="plugin-container" style="border:solid;background-color:white;color:transparent; width:100%; height:100%;">
          <div style="grid-area:top; display:flex; flex-direction:row; justify-content:center; align-items:flex-start;">
            ${trial.top_stims.map(
              (stim) => /*html*/ `
                <img class="draggable" src="${stim}" style="width:${trial.stim_size}" />
              `,
            )}
          </div>
          <div style="grid-area:right; display:flex; flex-direction:column; justify-content:center; align-items:flex-end;">
            ${trial.right_stims.map(
              (stim) => /*html*/ `
                <img class="draggable" src="${stim}" style="width:${trial.stim_size}" />
              `,
            )}
          </div>
          <div style="grid-area:bottom; display:flex; flex-direction:row; justify-content:center; align-items:flex-end;">
            ${trial.bottom_stims.map(
              (stim) => /*html*/ `
                <img class="draggable" src="${stim}" style="width:${trial.stim_size}" />
              `,
            )}
          </div>
          <div style="grid-area:left; display:flex; flex-direction:column; justify-content:center;">
            ${trial.left_stims.map(
              (stim) => /*html*/ `
                <img class="draggable" src="${stim}" style="width:${trial.stim_size}" />
              `,
            )}
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
    let move_order = 1;

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
          const rect = event.target.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          console.log(x);
          console.log(y);
          const stim_name = event.target.getAttribute('src').split('/')[
            event.target.getAttribute('src').split('/').length - 1
          ];

          stim_infos = {
            ...stim_infos,
            [stim_name]: {
              ...stim_infos[stim_name],
              x,
              y,
              ...('move_order' in (stim_infos[stim_name] || {})
                ? {}
                : { move_order: move_order++ }),
            },
          };
        },
      },
    });

    function dragMoveListener(event) {
      const target = event.target;
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
      const movedEveryObject = [
        trial.top_stims,
        trial.right_stims,
        trial.bottom_stims,
        trial.left_stims,
      ]
        .flat()
        .map(stim_to_name)
        .every((stim) => stim in stim_infos);
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
