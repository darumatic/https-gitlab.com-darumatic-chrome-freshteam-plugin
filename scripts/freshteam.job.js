(async function() {
  function formatName(username) {
    return username.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  function filePath(jobName, username, fileName) {
    return "freshteam/" + formatName(jobName) + "/" + formatName(username) + "/" + fileName;
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

  await driver.get(url);

  let hasNextPage = false;
  await driver.wait(until.elementLocated(By.css(".next-page")), 60000);


  let jobName = await driver.executeScript("return document.querySelector('.breadcrumb-title a:nth-child(1)').innerText.replace('View Job Details', '').trim();");
  await driver.executeScript("let open = window.__open || XMLHttpRequest.prototype.open;window.__open = open;window.results = {};XMLHttpRequest.prototype.open = function() {  this.addEventListener('load', event => {  let url = event.currentTarget.responseURL;    let matches = url.match(/.*.?hire.?applicants.?([0-9]+)/);    if (matches) {      let id = matches[1];      let result = JSON.parse(event.currentTarget.responseText);      window.results[id.toString().trim()] = result['attachments']||[];    }  }, false);  open.apply(this, arguments);};");


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

    let nextButton = await driver.findElement(By.css(".next-page"));
    await driver.executeScript("document.querySelector('.next-page').scrollIntoViewIfNeeded()");

    let nextButtonClass = await driver.executeScript("return document.querySelector('.next-page').className");
    hasNextPage = !nextButtonClass.includes("disabled");

    if (hasNextPage) {
      console.log("Start next page, ", hasNextPage);
      await nextButton.click();
      await driver.wait(until.elementLocated(By.css(".next-page")), 60000);
    }

  } while (hasNextPage);
})();