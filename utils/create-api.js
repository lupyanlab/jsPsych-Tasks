// import taskName from '../../utils/task-name.js';
import task from './task-name.js';

const ENDPOINT = `http://${window.location.hostname}:`;

const searchParams = new URLSearchParams(window.location.search);
const dev = searchParams.get('dev') === 'true';

export default (port) => (msg) =>
  axios.post(`${ENDPOINT}${port}`, { task, dev, ...msg }).then(({ data }) => data);
