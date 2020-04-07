/**
 * This imports all the plugins without having to
 * manually add each a new script element!
 */
export default () => {
  const pluginsPath = '../../lib/jspsych-6.1.0/plugins/';
  return axios.get('http://sapir.psych.wisc.edu:7124/jspsych-plugins').then(({ data: plugins }) =>
    Promise.all(
      plugins.map((plugin) => {
        const script = document.createElement('script');
        return new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          script.src = pluginsPath + plugin;
          document.head.appendChild(script);
        });
      }),
    ),
  );
};
