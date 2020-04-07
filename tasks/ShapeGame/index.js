import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import createApi from '../../utils/create-api.js';
import demographics_questions from '../template/demograhpics.js';

const preloaderEl = document.createElement('img');
preloaderEl.src = '../../assets/preloader.gif';
document.body.appendChild(preloaderEl);

const TASK = 'task1';
const api = createApi(TASK);

loadJsPsychPlugins().then(() => {
  const searchParams = new URLSearchParams(window.location.search);
  const worker_id = searchParams.get('workerId');
  console.log(worker_id);

  api({ fn: 'trials' }).then(({ trials, score, bonus }) => {
    const main_timeline = [];

    const consent_trial = {
      type: 'lupyanlab-consent',
      welcome: `The HIT you are about to do is sponsored by University of Wisconsin-Madison. You will complete a
      quick survey in which you will be shown some images, words, or hear some sounds and asked to
      make judgments about them. For example, you may be asked how typical apicture of a dog is of
      dogs in general, or to identify an ambiguous drawing, decide what word asound makes you think
      of, to choose which visual pattern best completes a sequence of patterns, or indicate how
      vividly you see in your “mind’s eye.”
      <strong>HIT instructions will be provided on the next screen. </strong>`,
      consent: `This task has no anticipated risks nor direct benefits. If you have any questions or concerns
      about this HIT please contact the principal investigator: Dr. Gary Lupyan at lupyan@wisc.edu. If
      you are not satisfied with response of the research team, have more questions, or want totalk
      with someone about your rights as a research participant, you should contact University of
      Wisconsin’s Education Research and Social & Behavioral Science IRB Office at 608-263-2320. You
      are free to decline to participate or to end participation at any time for any reason.`,
      checkbox_label: 'By clicking this box, I consent to participate in this task.',
      alert:
        'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
      button_label: 'Start Experiment',
    };
    main_timeline.push(consent_trial);

    const instructions = {
      type: 'instructions',
      key_forward: 'space',
      key_backward: 'backspace',
      show_clickable_nav: true,
      pages: [
        `
          You will be seeing 40 drawings along with some options for what each should be named.
          Most of the drawings will be of imaginary "creatures" and most of the options for their
          names will be "nonsense" words. Although the words are seemingly nonsense, most people
          feel that reading them calls up certain images in their mind. For each drawing, please
          look over all the options and select which one best fits the drawing.
        `,
      ],
    };
    main_timeline.push(instructions);

    // const shape_trials_block = {
    //   type: 'lupyanlab-shape',
    //   score_prefix_label: 'Your score: ',
    //   score_suffix_label: '',
    //   bonus_prefix_label: 'Current bonus: $',
    //   bonus_suffix_label: '',
    //   question: 'Please name this shape',
    //   input_placeholder: 'type here',
    //   submit_button_label: 'Submit',
    //   on_submit: async () => {
    //     ({ score, bonus } = await api({ fn: 'data' }));
    //   },
    //   // Nested timeline:  https://www.jspsych.org/overview/timeline/#nested-timelines
    //   timeline: trials.map((trial) => ({
    //     score,
    //     bonus,
    //     shape_image: trial.shape_image,
    //   })),
    // };
    // main_timeline.push(shape_trials_block);

    const demographics_trial = {
      type: 'lupyanlab-surveyjs',
      questions: demographics_questions,
      // on_submit: async (data) => {
      //   await api({ fn: 'demographics', data });
      // },
    };
    main_timeline.push(demographics_trial);

    jsPsych.init({
      timeline: main_timeline,
      fullscreen: FULLSCREEN,
      show_progress_bar: false,
      auto_update_progress_bar: false,
    });
  });
});
