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
    `<p class="lead">You will be shown 40 pictures of people or animals interacting with one other. Your task is to describe what is happening in each picture using a short sentence. Try to give a description that would make sense to someone else, so that they would be able to pick out the image based on the description you provided.<br><br><b>Please provide a short (one sentence) description.</b><br><br>It is also good to be specific, so if you see, for example, a man wearing diving goggles and an air tank petting a fish, it is better to write \"the scuba diver pets a fish\" rather than \"the man pets the fish\".</b><br><br>After you enter your description of the image, you will be asked how well you think your description fits the image. You can respond to this question by using the mouse/trackpad or the keyboard number keys 1-4.</p>`,
  ],
  TEXT_AREA_PLACEHOLDER: 'Your answer here...',
  LABELS: [
    '1-Pretty bad, but the best I could do',
    '2-Ok but someone else can probably up with a better description',
    '3-Pretty good. Someone else would describe it very similarly',
    '4-Excellent. Someone else would likely describe it in the same way',
  ],
  NEW_BATCH_PROMPT: '<p>Thank you for completing this batch of words</p>',
  DEMOGRAPHICS_INSTRUCTIONS: [
    `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be done!</p>`,
  ],
  DEBRIEF_TEXT: (
    participantID,
  ) => `Thank you for participating! Your completion code is ${participantID}. Copy and paste this in 
  MTurk to get paid. 
  
  <p>The purpose of this HIT is to quantify how much variability there is in the descriptions of these scenes which helps us understand why people
  with certain neurological impairments have trouble understanding what is going on in these scenes.</p>

  <p>If you have any questions or comments, please email vanparidon@wisc.edu.<p>`,
};
