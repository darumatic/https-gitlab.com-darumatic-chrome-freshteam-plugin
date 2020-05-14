/**
 * Runs tests
 */

const Run = require('../run');
const {
  onTestsDone,
  onSessionStarted,
  onFileStarted,
  onTestStarted
} = require('./internal-channels');

/**
 * Run tests
 *
 * @param {Object} data
 * @param {Object} data.target where to run tests
 * @param {String} [data.baseUrl] base url for files
 * @param {Array<String>} [data.files] files relative to baseUrl to be downloaded and runned
 * @param {Array<{path, code}>} [data.snippets] snippets
 * @param {Boolean} [data.devMode]
 */
exports.run = function(data) {
  try {
    const run = new Run({
      uiWindow: getUiWindow(),
      devMode: data.devMode,
      engine: 'selenium',
      target: data.target,
    });

    setRunnerListeners(run.runner, data);

    const runningPromise = run.runSnippets(data.snippets);
    return runningPromise
      .then(response => done(response), fail);
  } catch (e) {
    fail(e);
  }
};

/**
 * Returns first donkeyscript ui window
 */
function getUiWindow() {
  const views = chrome.extension.getViews({type: 'tab'});
  if (views.length) {
    return views[0];
  }
  return {};
}

function setRunnerListeners(runner, data) {
  runner.onFileStarted.addListener(res => onFileStarted.dispatch(res));
  runner.onTestStarted.addListener(res => onTestStarted.dispatch(res));
  runner.onSessionStarted.addListener(res => {
    onSessionStarted.dispatch({
      sessionId: res.sessionId,
      target: data.target,
    });
  });
}

function done(response) {
  onTestsDone.dispatch();
  return response;
}

function fail(e) {
  onTestsDone.dispatch();
  throw e;
}
