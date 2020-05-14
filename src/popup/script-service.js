function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

import options from "./options";
import scriptAll from "./scripts/freshteam.all";
import scriptJob from "./scripts/freshteam.job";

const scriptService = {
  scripts: [
    {
      id: "1",
      host: "https://.*.freshteam.com/",
      path: "/hire/jobs/",
      name: "Download all jobs",
      script: "(" + scriptAll.toString() + ")();",
      options: []
    },
    {
      id: "2",
      host: "https://.*.freshteam.com/",
      path: "/hire/jobs/.*/candidates/listview",
      name: "Download current jobs",
      script: "(" + scriptJob.toString() + ")();",
      options: []
    }
  ],
  textIndex: function(callback) {
    chrome.storage.sync.get(["textIndex"], value => {
      if (value.textIndex) {
        let textIndex = parseInt(value.textIndex) + 1;
        chrome.storage.sync.set({
          "textIndex": textIndex
        }, function() {
        });
        callback(textIndex);
      } else {
        let textIndex = 1;
        chrome.storage.sync.set({
          "textIndex": textIndex
        }, function() {
        });
        callback(textIndex);
      }
    });
  },
  getScript(id) {
    for (let i = 0; i < this.scripts.length; i++) {
      if (this.scripts[i].id === id) {
        return this.scripts[i];
      }
    }
    return null;
  },
  loadScripts: function(query, callback) {
    let url = new URL(query.url);

    function filter(script, host, path) {
      if (host && path) {
        return new RegExp(script.host).test(host) && new RegExp(script.path).test(path);
      }
      return false;
    }

    callback(this.scripts.filter(item => filter(item, url.hostname, url.pathname)));
  },

  getUserInfo: function(callback) {
    chrome.storage.sync.get(["userInfo"], value => {
      if (value.userInfo) {
        callback(JSON.parse(value.userInfo));
      } else {
        const userInfo = {
          clientId: uuidv4()
        };
        scriptService.setUserInfo(userInfo);
        callback(userInfo);
      }
    });
  },
  setUserInfo: function(userInfo) {
    chrome.storage.sync.set({
      "userInfo": JSON.stringify(userInfo)
    }, function() {
    });
  },
  getHistory: function(callback) {
    scriptService.getOptions(options => {
      if (options.historyEnabled) {
        chrome.storage.sync.get(["history"], value => {
          if (value.history) {
            callback(JSON.parse(value.history));
          } else {
            callback([]);
          }
        });
      } else {
        callback([]);
      }
    });
  },
  setHistory: function(history) {
    scriptService.getOptions(options => {
      if (options.historyEnabled) {
        if (history.length > 100) {
          history = history.slice(history.length - 100, history.length);
        }
        chrome.storage.sync.set({
          "history": JSON.stringify(history)
        }, function() {
        });
      }
    });
  },
  defaultOptions: function() {
    return {
      serverURL: options.SERVER_URL,
      historyEnabled: true
    };
  },
  getOptions: (callback) => {
    return callback(scriptService.defaultOptions());
  }
};

export default scriptService;