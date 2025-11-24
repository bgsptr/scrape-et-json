import fs from "fs";
import puppeteer from "puppeteer";
import readline from "readline";

async function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve =>
    rl.question(question, ans => {
      rl.close();
      resolve(ans);
    })
  );
}


function parseNetscapeCookies(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const cookies = [];

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\s+/); // tabs or spaces

    if (parts.length < 7) continue;

    const [
      domain,
      includeSubdomains,
      path,
      secure,
      expires,
      name,
      value
    ] = parts;

    cookies.push({
      domain,
      path,
      name,
      value,
      expires: Number(expires) || undefined,
      secure: secure.toUpperCase() === "TRUE",
      httpOnly: false, // Netscape format doesn't store this
    });
  }

  return cookies;
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Load + convert cookies
  const cookies = parseNetscapeCookies("../../Downloads/cookies.txt");
  
  const authUrl = "https://my.telkomsel.com/login/web";
  // Inject cookies
  await page.setCookie(...cookies);
  console.log("Loaded cookies from cookies.txt!");

    const phone = await ask("Masukkan nomor Telkomsel (contoh: 08123456789): ");

    await page.goto(authUrl, { waitUntil: "networkidle2" });

    await page.waitForSelector("#loginMsisdnInput");
    await page.type("#loginMsisdnInput", phone, { delay: 80 }); // FIX HERE

    await page.locator('button[data-testid="loginBtn"]').wait();
    await page.locator('button[data-testid="loginBtn"]').click();

  // Open website (should be logged in)
  await page.goto("https://my.telkomsel.com/app/loyalty-reward-details/SS25UUHQ4P15", { waitUntil: "networkidle0" });

  console.log("If the cookies were valid, you should be logged in now.");
})();
