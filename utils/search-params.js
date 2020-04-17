const searchParams = new URLSearchParams(window.location.search);

export default Array.from(searchParams.entries()).reduce((acc, [key, value]) => {
  if (value === 'true') {
    acc[key] = true;
  } else if (value === 'false') {
    acc[key] = false;
  } else {
    acc[key] = value;
  }
  return acc;
}, {});
