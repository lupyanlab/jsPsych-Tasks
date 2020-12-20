const ENDPOINT = `http://${window.location.hostname}:`;
/**
 * This imports all the plugins without having to
 * manually add each a new script element!
 */
export default (port) => {
  const pluginsPath = '../../lib/jspsych-6.1.0/plugins/';
  return axios.get(`${ENDPOINT}${port}/jspsych-plugins`).then(({ data: plugins }) =>
    Promise.all(
      plugins.map((plugin) => {
        const script = document.createElement('script');
        return new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          script.src = pluginsPath + plugin;
          document.head.appendChild(script);
        }).catch((error) => {
          console.warn(error);
        });
      }),
    ),
  );
};
