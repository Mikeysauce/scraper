require("dotenv").config();
const { chromium } = require("playwright");
const chalk = require("chalk");
const getFromS3 = require("./aws/s3");
const sendNotification = require("./aws/sns");

const pollIntervalMs = 30000;

const { EMAIL_TO, EMAIL_USERNAME, EMAIL_PASSWORD } = process.env;

let browserInstance;
let wsEndpoint;
let transporter;
let retailers;

const spawnBrowser = async ({ name, urls, noStockMessage }) => {
  const browser = await chromium.connect({ wsEndpoint });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
  });

  let page = await context.newPage();

  for (let retailer of urls) {
    try {
      await page.goto(retailer.url);
      await page.$(`text=${noStockMessage}`);

      const now = chalk.green(new Date().toLocaleTimeString());
      const formattedRetailer = chalk.red(name);
      const systemType = chalk.cyan(retailer.type);

      console.log(`${now} ${formattedRetailer} no stock (${systemType})`);
    } catch (error) {
      const now = new Date();
      console.log(
        `${chalk.green(now.toGMTString())} possible stock ${chalk.magenta(
          name,
        )} may have stock ${chalk.red(retailer.url)}`,
      );
      try {
        await sendNotification(
          `${name} possible stock of (${retailer.type}) : ${retailer.url}`,
        );
      } catch (error) {
        console.log("Tried to send logs, failed.", error);
      }
    }
  }
  await browser.close();
};

const scanRetailers = async () => {
  console.group(
    `${chalk.green(new Date().toDateString())} scanning selected retailers`,
  );
  const startTime = Date.now();
  await Promise.all(retailers.map(spawnBrowser));
  const finishTime = (Date.now() - startTime) / 1000;
  const pollTime = pollIntervalMs / 1000;
  console.log(
    `Scan group finished: ${finishTime} seconds, scanning group every ${pollTime} seconds`,
  );
  console.groupEnd();
};

(async () => {
  ({ retailers } = await getFromS3());

  browserInstance = await chromium.launchServer({
    headless: true,
  });
  wsEndpoint = browserInstance.wsEndpoint();
  setInterval(scanRetailers, pollIntervalMs);
  await scanRetailers();
})();
