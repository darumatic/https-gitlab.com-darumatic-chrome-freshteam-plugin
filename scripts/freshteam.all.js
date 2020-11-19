(async function() {
  await driver.get(url);

  let hasNextPage = "";
  await driver.wait(async function() {
    let state = await driver.executeScript("return document.readyState");
    console.log("current state", state);
    return state === "complete";
  }, 5000);
  do {
    let elements = await driver.findElements(By.css(".candidate-list-item"));

    console.log("##########1", elements.length);
    for (let i = 0; i < elements.length; i++) {
      let element = elements[i];
      let linkElement = await element.findElement(By.css("td:nth-child(2) a"));
      await linkElement.click();

      await driver.wait(async function() {
        return driver.isElementPresent(By.css(".attach-list"));
      }, 5000);

      console.log("##########2");
      let attachments = await element.findElements(By.css(".download-attached a[aria-label=Download]"));

      for (let j = 0; j < attachments.length; j++) {
        let attachment = attachments[j];
        let fileName = await attachment.getAttribute("download");
        let fileURL = await attachment.getAttribute("href");

        console.log("find attachment", fileName, fileURL);
      }

      console.log("##########3");
      let closeButton = await driver.findElement(By.css(".custom-modal-close a"));
      closeButton.click();

      await driver.wait(async function() {
        return !driver.isElementPresent(By.css(".custom-modal-close"));
      }, 5000);

      console.log("##########4");
    }

    let nextButton = await driver.findElement(By.css(".next-page"));
    let nextButtonClass = await nextButton.getAttribute("class");
    hasNextPage = !nextButtonClass.includes("disabled");

    console.log("##########5");

    if (hasNextPage) {
      await nextButton.click();

      await driver.wait(async function() {
        let state = await driver.executeScript("return document.readyState");
        console.log("current state", state);
        return state === "complete";
      }, 5000);
    }
  } while (hasNextPage);
})();