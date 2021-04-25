(async function() {
  function formatName(name) {
    return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  function filePath(jobName, username, fileName) {
    return "freshteam/" + formatName(jobName) + "/" + formatName(username) + "/" + fileName;
  }


  async function nextPageButton() {
    try {
      return await driver.findElement(By.css(".next-page"));
    } catch (e) {
      return null;
    }
  }

  async function hasNextPage() {
    try {
      await driver.executeScript("document.querySelector('.next-page').scrollIntoViewIfNeeded()");
    } catch (e) {
    }

    try {
      let nextButtonClass = await driver.executeScript("return document.querySelector('.next-page').className");
      return !nextButtonClass.includes("disabled");
    } catch (e) {
      console.log("warning: none next page button", e);
      return false;
    }
  }

  function download(url, name, retry) {
    let retried = typeof retry !== "undefined" ? retry : 0;
    let MAX_RETRIED = 5;

    if (retried <= MAX_RETRIED) {
      browser.downloads.download({ url: url, filename: name }, (downloadId) => {
        if (downloadId) {
          console.log("download " + url + " successfully");
        } else {
          download(url, name, retried++);
        }
      });
    } else {
      console.log("download " + url + " failed");
    }
  }

  let totalDownloads = 0;
  console.log(browser.downloads);

  browser.downloads.onChanged.addListener(function() {
    browser.downloads.search({ limit: 0 }, function(items) {
      var activeDownloads = [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.state === "in_progress") activeDownloads.push(item.id);
      }
      totalDownloads = activeDownloads.length;
    });
  });

  async function downloadAttachments(url) {
    await driver.get(url);

    await driver.wait(until.elementLocated(By.css(".breadcrumb-title")), 60000);

    let jobName = await driver.executeScript("return document.querySelector('.breadcrumb-title a:nth-child(1)').innerText.replace('View Job Details', '').trim();");
    await driver.executeScript("let open = window.__open || XMLHttpRequest.prototype.open;window.__open = open;window.results = {};XMLHttpRequest.prototype.open = function() {  this.addEventListener('load', event => {  let url = event.currentTarget.responseURL;    let matches = url.match(/.*.?hire.?applicants.?([0-9]+)/);    if (matches) {      let id = matches[1];      let result = JSON.parse(event.currentTarget.responseText);      window.results[id.toString().trim()] = result['attachments']||[];    }  }, false);  open.apply(this, arguments);};");

    let nextPageEnabled = false;
    do {
      console.log("Start downloading attachments");

      await driver.wait(async function() {
        return await driver.executeScript("return document.querySelector('.pagearea-content .no-data-title') !== null || document.querySelector('.pagearea-content .candidate-list-item') !==null");
      }, 60000);

      let elements = await driver.findElements(By.css(".candidate-list-item"));

      for (let i = 0; i < elements.length; i++) {
        console.log("candidates ", i);
        let selector = ".pagearea-content tr:nth-child(" + (i + 2) + ") td:nth-child(2) a";
        let linkElement = await driver.findElement(By.css(selector));
        await driver.executeScript("document.querySelector('" + selector + "').scrollIntoViewIfNeeded()");
        await linkElement.click();

        let nameElement = await linkElement.findElement(By.css(".name"));
        let username = await nameElement.getAttribute("title");

        let ajaxResults = null;
        await driver.wait(async function() {
          ajaxResults = await driver.executeScript("let url = window.location.href;let matches = url.match(/.*candidates.?listview.?([0-9]+)/);id = matches[1];return window.results[id];");
          return ajaxResults != null;
        }, 60000);

        let attachments = ajaxResults.map(item => {
          return {
            name: item["content_file_name"],
            url: item["expiring_urls"]["original"]
          };
        });
        console.log(username + " attachments", attachments);

        for (let j = 0; j < attachments.length; j++) {
          let attachment = attachments[j];
          console.log("find attachment", attachment.name, attachment.url);

          await driver.wait(async function() {
            return totalDownloads < 3;
          }, 10000);

          download(attachment.url, filePath(jobName, username, attachment.name));
        }

        let closeButton = await driver.findElement(By.css(".custom-modal-close a"));
        await closeButton.click();

        await driver.wait(async function() {
          await driver.executeScript("return document.querySelector('.custom-modal-close a') && document.querySelector('.custom-modal-close a').click()");
          let buttons = await driver.findElements(By.css(".custom-modal-close"));
          console.log("buttons", buttons);
          return buttons.length === 0;
        }, 60000);
      }

      let nextButton = await nextPageButton();
      if (nextButton) {
        console.log("hasNextPage", hasNextPage);
        nextPageEnabled = await hasNextPage();
        if (nextPageEnabled) {
          console.log("Start next page, ", nextPageEnabled);
          try {
            await driver.executeScript("document.querySelector('.next-page').scrollIntoViewIfNeeded()");
          } catch (e) {
          }
          await nextButton.click();
        }
      } else {
        nextPageEnabled = false;
      }

    } while (nextPageEnabled);
  }

  function nextPageURL(url) {
    if (!url.includes("page=")) {
      return url + "?page=2";
    }

    let matched = url.match(/page=(\d+)/);
    if (matched) {
      let page = matched[1];
      if (parseInt(page) > 0) {
        return url.replace(/page=\d+/, "page=" + (parseInt(page) + 1));
      }
    }
    return null;
  }

  async function downloadJobs(url) {

    await driver.get(url);
    let nextPageEnabled = false;

    do {
      await driver.wait(until.elementLocated(By.css(".job-list .col-block")), 60000);
      let elements = await driver.findElements(By.css(".job-list .col-block .col-inside > a"));

      let jobURLs = [];
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let jobURL = await element.getAttribute("href");
        jobURLs.push(jobURL);
      }

      console.log("jobURL:", jobURLs);

      nextPageEnabled = await hasNextPage();

      console.log("nextPageEnabled:", nextPageEnabled);
      let nextURL = nextPageEnabled ? nextPageURL(url) : null;
      console.log("nextURL:", nextURL);

      for (let i = 0; i < jobURLs.length; i++) {
        let jobURL = jobURLs[i];
        await downloadAttachments(jobURL);
      }

      if (nextURL) {
        await driver.get(nextURL);
      } else {
        nextPageEnabled = false;
      }
    } while (nextPageEnabled);
  }

  await downloadJobs(url);
})();
