(async function() {
  function formatName(username) {
    return username.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  function filePath(jobName, username, fileName) {
    return "freshteam/" + formatName(jobName) + "/" + formatName(username) + "/" + fileName;
  }

  await driver.get(url);


  let hasNextPage = false;
  await driver.wait(until.elementLocated(By.css(".next-page")), 60000);


  let jobName = await driver.executeScript("return document.querySelector('.breadcrumb-title a:nth-child(1)').innerText.replace('View Job Details', '').trim();");

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

      let timestamp = null;
      await driver.wait(async function() {
        let html = await driver.executeScript("return document.querySelector('.attach-wrap').innerHTML");
        if (html.includes("<!---->") && timestamp === null) {
          timestamp = new Date().getTime();
        }
        let currentTimeStamp = new Date().getTime();
        return html.includes("attach-info") || html.includes("<!---->") && currentTimeStamp - timestamp > 500;
      }, 60000);

      let attachments = await driver.executeScript("return Array.from(document.querySelectorAll('.download-attached a:nth-child(2)')).map(item=>{return {name: item.getAttribute('download'), url:item.getAttribute('href')}})");

      console.log(username + " attachments", attachments);

      for (let j = 0; j < attachments.length; j++) {
        let attachment = attachments[j];
        console.log("find attachment", attachment.name, attachment.url);

        browser.downloads.download({ url: attachment.url, filename: filePath(jobName, username, attachment.name) });
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