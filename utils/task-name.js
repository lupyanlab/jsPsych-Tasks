// Task name is the last route in pathname
export default window.location.pathname
  .split('/')
  .filter((p) => p.length > 0)
  .pop();
