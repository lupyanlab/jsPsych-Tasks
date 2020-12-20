# jsPsych Manual changes

In `jspsych.js`, manuage changes were made to allow plugins' `on_finish` function to accept promises. This enables `experiment.js` to call the api using `await` or simply returning the api expression to wait for it to resolve before continuing to the next trial.

```diff
- core.finishTrial = function(data) {
+ core.finishTrial = async function(data) {
...
- current_trial.on_finish(trial_data_values);
+ await current_trial.on_finish(trial_data_values);
...
```
