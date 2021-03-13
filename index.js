require("dotenv").config();
const { chromium } = require("playwright");
const chalk = require("chalk");
const nodemailer = require("nodemailer");
const sendSms = require("./send-sms");

const pollIntervalMs = 30000;

const { EMAIL_TO, EMAIL_USERNAME, EMAIL_PASSWORD } = process.env;
const { retailers } = require("./retailers.json");

let browserInstance;
let wsEndpoint;
let transporter;

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
        await Promise.all([
          sendMail({ url: retailer.url, name, type: retailer.type }),
          sendSms(`retailer ${name} may have stock: [${now.toGMTString()}]`),
        ]);
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

const setupMail = async () => {
  return nodemailer.createTransport({
    host: "smtppro.zoho.eu",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
  });
};

const sendMail = async ({ name, type, url }) =>
  transporter.sendMail({
    from: `"Michael Shelton BOT" <${EMAIL_USERNAME}>`,
    to: EMAIL_TO,
    subject: `Stock Alert 🚀 - ${name} - ${type}`,
    html: `<p>Potential stock detected for: <b>${type}</b> <br/>Link: ${url}</p>`,
  });

(async () => {
  transporter = await setupMail();
  await sendMail({ name: "testing", type: "type", url: "url" });
  browserInstance = await chromium.launchServer({
    headless: true,
  });
  wsEndpoint = browserInstance.wsEndpoint();
  setInterval(scanRetailers, pollIntervalMs);
  await scanRetailers();
})();
