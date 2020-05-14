/**
 * Setup browser action to open donkeyscript UI
 */
const testsRun = require("../tests-run");
import db from "../../popup/script-service";
import "./analytics";

let index = 0;
let runEnabled = false;
exports.setup = function() {
  let currentScript;

  function running() {
    if (runEnabled) {
      var path = "frame-" + index + ".png";
      chrome.browserAction.setIcon({ path });
      index = (index + 1) % 9;
      setTimeout(running, 30);
      if (!runEnabled) {
        done();
      }
    } else {
      done();
    }
  }

  function done() {
    runEnabled = false;
    chrome.browserAction.setIcon({ path: "favicon-128x128.png" });
  }

  chrome.debugger.onDetach.addListener(() => {
    done();
  });

  chrome.runtime.onMessage.addListener(function(request) {
    if (request.type === "SCRIPT_RUN") {
      currentScript = request.options;
      running();

      let script = db.getScript(currentScript.id);

      testsRun.run({
          target: {
            serverUrl: "http://donkeyscript",
            loopback: true,
            tabId: request.options.tabId,
            caps: {
              "browserName": "chrome"
            }
          },
          snippets: [{
            path: "code.js",
            code: script.script,
            params: {
              url: request.options.url,
              option: request.options.option
            }
          }]
        }
      ).then(() => {
        console.log("DONE");
        done();
      }).catch((e) => {
        console.log("ERROR", e.message);
        done();
      });
      return true;
    } else if (request.type === "SCRIPT_CANCEL") {
      console.log("SCRIPT_CANCEL");
      done();
    } else if (request.type === "LOGIN") {
      db.setUserInfo({
        userId: request.options.userId,
        username: request.options.username,
        token: request.options.token
      });
      return true;
    } else if (request.type === "LOGOUT") {
      db.setUserInfo({});
      return true;
    } else if (request.type === "LOADED") {
      if (runEnabled) {
        done();
      }
      return true;
    }
  });
};
