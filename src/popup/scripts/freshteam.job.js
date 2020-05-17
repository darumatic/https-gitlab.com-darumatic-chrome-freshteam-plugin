(async function() {
  await driver.get(url);

  let hasNextPage = "";
  await driver.wait(until.elementLocated(By.css(".next-page")), 60000);

  do {
    let elements = await driver.findElements(By.css(".candidate-list-item"));

    console.log("##########1", elements.length);
    for (let i = 0; i < elements.length; i++) {
      console.log("candidates ", i);
      let selector = ".pagearea-content tr:nth-child(" + (i + 2) + ") td:nth-child(2) a";
      let linkElement = await driver.findElement(By.css(selector));
      driver.executeScript("document.querySelector('" + selector + "').scrollIntoViewIfNeeded()");
      console.log("##########1.1");
      await linkElement.click();

      await driver.wait(until.elementLocated(By.css(".custom-modal-close")), 60000);

      console.log("##########2");

      let attachments = await driver.executeScript("return Array.from(document.querySelectorAll('.download-attached a:nth-child(2)')).map(item=>{return {name: item.getAttribute('download'), url:item.getAttribute('href')}})");
      console.log("attachments", attachments);

      for (let j = 0; j < attachments.length; j++) {
        let attachment = attachments[j];

        console.log("find attachment", attachment.name, attachment.url);
      }

      console.log("##########3");
      let closeButton = await driver.findElement(By.css(".custom-modal-close a"));
      await closeButton.click();

      console.log("##########4");
      await driver.wait(async function() {
        await driver.executeScript("return document.querySelector('.custom-modal-close a') && document.querySelector('.custom-modal-close a').click()");
        let buttons = await driver.findElements(By.css(".custom-modal-close"));
        console.log("buttons", buttons);
        return buttons.length === 0;
      }, 60000);
      console.log("##########5");
    }

    let nextButton = await driver.findElement(By.css(".next-page"));
    let nextButtonClass = await nextButton.getAttribute("class");
    hasNextPage = !nextButtonClass.includes("disabled");

    console.log("##########6");

    if (hasNextPage) {
      await nextButton.click();
      await driver.wait(until.elementLocated(By.css(".next-page")), 10000);
    }
  } while (hasNextPage);
})();