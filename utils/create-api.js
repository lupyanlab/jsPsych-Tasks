const ENDPOINT = `${window.location.origin}:7124`;

export default (task, dev = false) => (msg) =>
  axios.post(ENDPOINT, { task: task, dev, ...msg }).then(({ data }) => data);
