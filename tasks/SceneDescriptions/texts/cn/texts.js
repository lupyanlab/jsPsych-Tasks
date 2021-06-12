export default {
  ERROR_MESSAGE:
    '<h3>Testing lang=cn. Something went wrong. Please try reloading again and check your connection before contacting us.</h3>',
  FULL_SCREEN_MESSAGE:
    '<p>Testing lang=cn. This will switch to full screen mode when you press the button below</p>',
  CONSENT_ALERT:
    'Testing lang=cn. If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
  START_EXPERIMENT_BUTTON_LABEL: 'Testing lang=cn. Start Experiment',
  INSTRUCTIONS: [
    `<p class="lead">Testing lang=cn. You will be shown some shapes. Your task is to name them in the simplest way possible. Try to choose a name that would most make sense to someone else such that someone would be able to pick out the shape based on the name you provided. <br><b>Please keep your responses short.</b> One word is best.  If you need to use 2-3 words for some, that's ok. <br><br>After you enter your name for the shape, you will be asked how happy you are with your response. You can respond to this question by using the mouse/trackpad or the keyboard number keys 1-4.
    </p>`,
  ],
  TEXT_AREA_PLACEHOLDER: 'Testing lang=cn. Your answer here...',
  LABELS: [
    'Testing lang=cn. 1-Pretty bad, but the best I could do',
    'Testing lang=cn. 2-Ok but someone else can probably up with a better one',
    'Testing lang=cn. 3-Pretty good. Someone else would call it something similar',
    'Testing lang=cn. 4-Excellent. Someone else would most likely use the same name',
  ],
  NEW_BATCH_PROMPT: '<p>Testing lang=cn. Thank you for completing this batch of words</p>',
  DEMOGRAPHICS_INSTRUCTIONS: [
    `<p class="lead">Testing lang=cn. Thank you! We'll now ask a few demographic questions and you'll be done!</p>`,
  ],
  DEBRIEF_TEXT: (
    participantID,
  ) => `Testing lang=cn. Thank you for participating! Your completion code is ${participantID}. Copy and paste this in 
  MTurk to get paid. 
  
  <p>The purpose of this HIT is to understand what makes certain shapes easy vs. hard to name.</p>

  <p>If you have any questions or comments, please email lupyan@wisc.edu.<p>`,
  FULLSCREEN_CONTINUE_BUTTON_LABEL: 'Continue',
};
