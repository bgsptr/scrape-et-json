import fs from "fs";
import readline from "readline";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

function parseNetscapeCookies(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const cookies = [];

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 7) continue;
    const [domain, includeSubdomains, path, secure, expires, name, value] = parts;
    cookies.push({
      domain,
      path,
      name,
      value,
      expires: Number(expires) || undefined,
      secure: secure.toUpperCase() === "TRUE",
      httpOnly: false,
    });
  }
  return cookies;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
    protocolTimeout: 24 * 60 * 60 * 1000
  });

  const page = await browser.newPage();

  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1366, height: 768 });

  const cookies = parseNetscapeCookies("../../Downloads/cookies.txt");

  await page.goto("https://my.telkomsel.com", { waitUntil: "domcontentloaded" });
  await page.setCookie(...cookies);

  console.log("Loaded cookies!");

  //const phone = await ask("Masukkan nomor Telkomsel: ");
  //const phone = "81338494371";
  //const phone = "82147549549";
  //const phone = "81337329329";
  //const phone = "81238502355";
  //const phone = "81259900142";
  const phone = "81336160863";

  const authUrl = "https://my.telkomsel.com/login/web";
  await page.goto(authUrl, { waitUntil: "networkidle2" });

  await page.waitForSelector("#loginMsisdnInput");

  await page.type("#loginMsisdnInput", phone, {
    delay: 300 + Math.random() * 50
  });

  //await page.waitForSelector('button[data-testid="loginBtn"].LoginFormV2__style__loginBtn', { timeout: 3000 });

  //await page.click('button[data-testid="loginBtn"].LoginFormV2__style__loginBtn', {
  //  delay: 150 + Math.random() * 100
  //});
  //

  // wait until the button becomes enabled
  await page.waitForSelector(
    'div.LoginFormV2__style__buttonWrapper > button[data-testid="loginBtn"].LoginFormV2__style__loginBtn:not([disabled])',
    { timeout: 6000 }
  );

  // click it
  await page.click(
    'div.LoginFormV2__style__buttonWrapper > button[data-testid="loginBtn"].LoginFormV2__style__loginBtn:not([disabled])',
    {
      delay: 150 + Math.random() * 100
    }
  );

  await page.goto("https://my.telkomsel.com/web", {
    waitUntil: "networkidle0"
  });

  // Wait 15 seconds
  await new Promise(resolve => setTimeout(resolve, 15000));

  const el = await page.waitForSelector(".StatusInfo__style__poin", { timeout: 15000 });

  if (!el) {
    console.log("Element not found after 15 seconds");
  }
  
  const poin = await page.evaluate(el => el.textContent.trim(), el);
  console.log(poin);
  let poinAmount = poin.split(" ")[0];
  console.log("Poin didapatkan:", poinAmount);

  //const rewardId = "SS25UUHQ4P15"; //samsung s25
  //const rewardId = "VLXUUHQ4P15"; //vespa
  //const rewardId = "BEAUUHQ4P15"; //honda beat cbs
  const rewardId = "CBRUUHQ4P15"; //moge cbr

  await page.goto(`https://my.telkomsel.com/app/loyalty-reward-details/${rewardId}`);

  //poinAmount = 1591
  while (poinAmount > 0) {
    await page.click('button[data-testid="btn"]', {
      delay: 500 + Math.random() * 100
    }); 

    async function clickInTelkomselFrame(page, selector, delayTime, timeout) { 
      const el2 = await page.waitForSelector(selector, { timeout: timeout });
      const data = await page.evaluate(el2 => el2.textContent.trim().toLowerCase(), el2);
      console.log(data);

      await page.click(selector, { delay: delayTime + Math.random() * 100 });
    }

    await clickInTelkomselFrame(
      page,
      'div.DetailReward__style__dialogButton > button[data-testid="btn"]:first-child',
      1350,
      10000
    );

    console.log(poinAmount);

    await clickInTelkomselFrame(
      page,
      'button[data-testid="btn"].Button__style__primary.PaymentPoin__style__rewardDetailButton',
      1400,
      10000
    )

    poinAmount--;
  }

  console.log("Done.");
})();
