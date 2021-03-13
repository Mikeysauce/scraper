require("dotenv").config();
const { chromium } = require("playwright");
const sendSms = require("./send-sms");
const chalk = require("chalk");

const pollIntervalMs = 30000;

const PLAYSTATION_5 = "Playstation 5";
const XBOX_SERIES_X = "Xbox Series X";

const retailers = [
  {
    name: "shopto",
    urls: [
      {
        url: "https://www.shopto.net/en/ps5hw01-playstation-5-console-p191472/",
        type: PLAYSTATION_5,
      },
      {
        url:
          "https://www.shopto.net/en/xbxhw01-xbox-series-x-p191471/?utm_source=website&utm_medium=banner&utm_campaign=Xbox%20Series%20X",
        type: XBOX_SERIES_X,
      },
    ],
    noStockMessage: "Sold out",
  },
  {
    name: "Simply Games",
    urls: [
      {
        url: "https://www.simplygames.com/p/xbox-series-x-console-xbox-one",
        type: XBOX_SERIES_X,
      },
    ],

    noStockMessage: "Out Of Stock",
  },
  {
    name: "Currys",
    urls: [
      {
        url:
          "https://www.currys.co.uk/gbuk/gaming/console-gaming/consoles/microsoft-xbox-series-x-1-tb-10203371-pdt.html",
        type: XBOX_SERIES_X,
      },
    ],
    noStockMessage: "Sorry this item is out of stock",
  },
  {
    name: "Smyths",
    urls: [
      {
        url:
          "https://www.smythstoys.com/uk/en-gb/video-games-and-tablets/xbox-gaming/xbox-series-x-%7c-s/xbox-series-x-%7c-s-consoles/xbox-series-x-1tb-console/p/192012",
        type: XBOX_SERIES_X,
      },
    ],
    noStockMessage: "Out Of Stock",
  },
  {
    name: "John Lewis",
    urls: [
      {
        url:
          "https://www.johnlewis.com/microsoft-xbox-series-x-console-1tb-with-wireless-controller-black/p5151987",
        type: XBOX_SERIES_X,
      },
    ],
    noStockMessage: "Out of stock",
  },
  {
    name: "Scan",
    urls: [
      {
        url: "https://www.scan.co.uk/products/playstation-5-console",
        type: PLAYSTATION_5,
      },
    ],
    noStockMessage: "PlayStation 5 Console - Allocation update soon",
  },
  {
    name: "Amazon",
    urls: [
      {
        url:
          "https://www.amazon.co.uk/Xbox-RRT-00007-Series-X/dp/B08H93GKNJ/ref=sr_1_1?ascsubtag=radiotimes-889910&dchild=1&keywords=xbox+series+x&qid=1605987694&s=videogames&sr=1-1&tag=radtim0b-21",
        type: XBOX_SERIES_X,
      },
    ],
    noStockMessage: "Want us to e-mail you when this item becomes available?",
  },
  {
    name: "Amazon",
    urls: [
      {
        url:
          "https://www.amazon.co.uk/PlayStation-9395003-5-Console/dp/B08H95Y452/ref=sr_1_1?dchild=1&keywords=ps5&qid=1615656178&sr=8-1",
        type: PLAYSTATION_5,
      },
    ],
    noStockMessage: "Currently unavailable",
  },
  {
    name: "Argos",
    urls: [
      {
        url: "https://www.argos.co.uk/product/8349000",
        type: PLAYSTATION_5,
      },
    ],
    noStockMessage:
      "We're working hard to make this available as soon as possible.",
  },
  {
    name: "Ebuyer",
    urls: [
      {
        url:
          "https://www.ebuyer.com/1133942-sony-playstation-5-digital-edition-cfi-1016b-",
        type: PLAYSTATION_5,
      },
    ],
    noStockMessage:
      "***More stock is due soon - Existing Pre-Orders are being prioritised, and is allocated on a first come first served basis.***",
  },
  {
    name: "Game",
    urls: [
      {
        url: "https://www.game.co.uk/playstation-5",
        type: PLAYSTATION_5,
      },
    ],
    noStockMessage: "Out of stock",
  },
];

const spawnBrowser = async ({ name, urls, noStockMessage }) => {
  const browser = await chromium.launch({ chromiumSandbox: true });
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
      await page.screenshot({
        path: `${name}-${Number(new Date()).toString()}.png`,
      });
      await sendSms(`retailer ${name} may have stock: [${now.toGMTString()}]`);
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
  setInterval(scanRetailers, pollIntervalMs);
  await scanRetailers();
})();
