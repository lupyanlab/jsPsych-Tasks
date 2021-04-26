export default {
  LOADING_MESSAGE: 'Loading trials... please wait.',
  ERROR_MESSAGE:
    '<h3>Something went wrong. Please try reloading again and check your connection before contacting us.</h3>',
  FULL_SCREEN_MESSAGE:
    '<p>This will switch to full screen mode when you press the button below</p>',
  CONSENT_ALERT:
    'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
  START_EXPERIMENT_BUTTON_LABEL: 'Start Experiment',
  INSTRUCTIONS: [
    `<p class="lead">You will be shown some shapes. Your task is to name them in the simplest way possible. Try to choose a name that would most make sense to someone else such that someone would be able to pick out the shape based on the name you provided. <br><b>Please keep your responses short.</b> One word is best.  If you need to use 2-3 words for some, that's ok. <br><br>After you enter your name for the shape, you will be asked how happy you are with your response. You can respond to this question by using the mouse/trackpad or the keyboard number keys 1-4.
    </p>`,
  ],
  TEXT_AREA_PLACEHOLDER: 'Your answer here...',
  LABELS: [
    '1-Pretty bad, but the best I could do',
    '2-Ok but someone else can probably up with a better one',
    '3-Pretty good. Someone else would call it something similar',
    '4-Excellent. Someone else would most likely use the same name',
  ],
  NEW_BATCH_PROMPT: '<p>Thank you for completing this batch of words</p>',
  DEMOGRAPHICS_INSTRUCTIONS: [
    `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be done!</p>`,
  ],
  DEBRIEF_TEXT: (
    participantID,
  ) => `Thank you for participating! Your completion code is ${participantID}. Copy and paste this in 
  MTurk to get paid. 
  
  <p>The purpose of this HIT is to understand what makes certain shapes easy vs. hard to name.</p>

  <p>If you have any questions or comments, please email lupyan@wisc.edu.<p>`,
};
