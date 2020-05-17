function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

import options from "./options";


const scriptService = {
  scripts: [
    {
      id: "1",
      host: ".*.freshteam.com$",
      path: "^/hire/jobs/?$",
      name: "Download all jobs",
      script: "()();",
      options: []
    },
    {
      id: "2",
      host: ".*.freshteam.com$",
      path: "^/hire/jobs/.*/candidates/listview/?$",
      name: "Download current job",
      script: "(async function() {\n  await driver.get(url);\n\n  let hasNextPage = \"\";\n  await driver.wait(until.elementLocated(By.css(\".next-page\")), 60000);\n\n  do {\n    let elements = await driver.findElements(By.css(\".candidate-list-item\"));\n\n    console.log(\"##########1\", elements.length);\n    for (let i = 0; i < elements.length; i++) {\n      console.log(\"candidates \", i);\n      let selector = \".pagearea-content tr:nth-child(\" + (i + 2) + \") td:nth-child(2) a\";\n      let linkElement = await driver.findElement(By.css(selector));\n      driver.executeScript(\"document.querySelector('\" + selector + \"').scrollIntoViewIfNeeded()\");\n      console.log(\"##########1.1\");\n      await linkElement.click();\n\n      await driver.wait(until.elementLocated(By.css(\".custom-modal-close\")), 60000);\n\n      console.log(\"##########2\");\n\n      let attachments = await driver.executeScript(\"return Array.from(document.querySelectorAll('.download-attached a:nth-child(2)')).map(item=>{return {name: item.getAttribute('download'), url:item.getAttribute('href')}})\");\n      console.log(\"attachments\", attachments);\n\n      for (let j = 0; j < attachments.length; j++) {\n        let attachment = attachments[j];\n\n        console.log(\"find attachment\", attachment.name, attachment.url);\n      }\n\n      console.log(\"##########3\");\n      let closeButton = await driver.findElement(By.css(\".custom-modal-close a\"));\n      await closeButton.click();\n\n      console.log(\"##########4\");\n      await driver.wait(async function() {\n        await driver.executeScript(\"return document.querySelector('.custom-modal-close a') && document.querySelector('.custom-modal-close a').click()\");\n        let buttons = await driver.findElements(By.css(\".custom-modal-close\"));\n        console.log(\"buttons\", buttons);\n        return buttons.length === 0;\n      }, 60000);\n      console.log(\"##########5\");\n    }\n\n    let nextButton = await driver.findElement(By.css(\".next-page\"));\n    let nextButtonClass = await nextButton.getAttribute(\"class\");\n    hasNextPage = !nextButtonClass.includes(\"disabled\");\n\n    console.log(\"##########6\");\n\n    if (hasNextPage) {\n      await nextButton.click();\n      await driver.wait(until.elementLocated(By.css(\".next-page\")), 10000);\n    }\n  } while (hasNextPage);\n})();",
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

    console.log("url", url);

    function filter(script, host, path) {
      if (host && path) {
        return new RegExp(script.host).test(host) && new RegExp(script.path).test(path);
      }
      return false;
    }

    let scripts = [];
    for (let i = 0; i < scriptService.scripts.length; i++) {
      if (filter(scriptService.scripts[i], url.hostname, url.pathname)) {
        scripts.push(scriptService.scripts[i]);
      }
    }

    callback(scripts);
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