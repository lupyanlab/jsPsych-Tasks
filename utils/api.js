// import taskName from '../../utils/task-name.js';
import task from './task-name.js';

const ENDPOINT = `${window.location.origin}:7124`;

const searchParams = new URLSearchParams(window.location.search);
const dev = searchParams.get('dev') === 'true';

export default (msg) => axios.post(ENDPOINT, { task, dev, ...msg }).then(({ data }) => data);
