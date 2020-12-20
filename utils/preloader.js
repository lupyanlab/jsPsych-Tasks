const preloaderContainer = document.createElement('div');

preloaderContainer.innerHTML = /* html */ `
  <div id="preloader-gif-container" style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
    <h1>Loading trials... please wait.</h1>
    <img src="../../assets/preloader.gif" />
  </div>
`;

document.body.appendChild(preloaderContainer);
