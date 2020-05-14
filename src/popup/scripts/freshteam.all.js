const script = async function() {
  await driver.get(url);
  await driver.wait(async function() {
    let state = await driver.executeScript("return document.readyState");
    return state === "complete";
  }, 5000);
}

export default script