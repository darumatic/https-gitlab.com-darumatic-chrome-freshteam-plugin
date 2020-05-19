function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

import options from "./options";


const scriptService = {
  scripts: [
    {
      id: "2",
      host: ".*.freshteam.com$",
      path: "^/hire/jobs/.*/candidates/listview/?$",
      name: "Download Attachments",
      script: "(async function() {\n  function formatName(username) {\n    return username.replace(/[^a-z0-9]/gi, \"_\").toLowerCase();\n  }\n\n  function filePath(jobName, username, fileName) {\n    return \"freshteam/\" + formatName(jobName) + \"/\" + formatName(username) + \"/\" + fileName;\n  }\n\n  await driver.get(url);\n\n\n  let hasNextPage = false;\n  await driver.wait(until.elementLocated(By.css(\".next-page\")), 60000);\n\n\n  let jobName = await driver.executeScript(\"return document.querySelector('.breadcrumb-title a:nth-child(1)').innerText.replace('View Job Details', '').trim();\");\n\n  do {\n    console.log(\"Start downloading attachments\");\n\n    await driver.wait(async function() {\n      return await driver.executeScript(\"return document.querySelector('.pagearea-content .no-data-title') !== null || document.querySelector('.pagearea-content .candidate-list-item') !==null\");\n    }, 60000);\n\n    let elements = await driver.findElements(By.css(\".candidate-list-item\"));\n\n    for (let i = 0; i < elements.length; i++) {\n      console.log(\"candidates \", i);\n      let selector = \".pagearea-content tr:nth-child(\" + (i + 2) + \") td:nth-child(2) a\";\n      let linkElement = await driver.findElement(By.css(selector));\n      await driver.executeScript(\"document.querySelector('\" + selector + \"').scrollIntoViewIfNeeded()\");\n      await linkElement.click();\n\n      let nameElement = await linkElement.findElement(By.css(\".name\"));\n      let username = await nameElement.getAttribute(\"title\");\n\n      let timestamp = null;\n      await driver.wait(async function() {\n        let html = await driver.executeScript(\"return document.querySelector('.attach-wrap').innerHTML\");\n        if (html.includes(\"<!---->\") && timestamp === null) {\n          timestamp = new Date().getTime();\n        }\n        let currentTimeStamp = new Date().getTime();\n        return html.includes(\"attach-info\") || html.includes(\"<!---->\") && currentTimeStamp - timestamp > 500;\n      }, 60000);\n\n      let attachments = await driver.executeScript(\"return Array.from(document.querySelectorAll('.download-attached a:nth-child(2)')).map(item=>{return {name: item.getAttribute('download'), url:item.getAttribute('href')}})\");\n\n      console.log(username + \" attachments\", attachments);\n\n      for (let j = 0; j < attachments.length; j++) {\n        let attachment = attachments[j];\n        console.log(\"find attachment\", attachment.name, attachment.url);\n\n        browser.downloads.download({ url: attachment.url, filename: filePath(jobName, username, attachment.name) });\n      }\n\n      let closeButton = await driver.findElement(By.css(\".custom-modal-close a\"));\n      await closeButton.click();\n\n      await driver.wait(async function() {\n        await driver.executeScript(\"return document.querySelector('.custom-modal-close a') && document.querySelector('.custom-modal-close a').click()\");\n        let buttons = await driver.findElements(By.css(\".custom-modal-close\"));\n        console.log(\"buttons\", buttons);\n        return buttons.length === 0;\n      }, 60000);\n    }\n\n    let nextButton = await driver.findElement(By.css(\".next-page\"));\n    await driver.executeScript(\"document.querySelector('.next-page').scrollIntoViewIfNeeded()\");\n\n    let nextButtonClass = await driver.executeScript(\"return document.querySelector('.next-page').className\");\n    hasNextPage = !nextButtonClass.includes(\"disabled\");\n\n    if (hasNextPage) {\n      console.log(\"Start next page, \", hasNextPage);\n      await nextButton.click();\n      await driver.wait(until.elementLocated(By.css(\".next-page\")), 60000);\n    }\n\n  } while (hasNextPage);\n})();",
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