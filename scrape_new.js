import puppeteer from "puppeteer";
import readline from "readline";

// ------------ Terminal Input Helper ------------
function ask(question) {
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

const delay = ms => new Promise(res => setTimeout(res, ms));

// ------------ MAIN SCRIPT ------------
async function scraper() {
  console.log("\n[info] Launching Chrome (NO STEALTH)...");

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/usr/bin/google-chrome-stable", // PENTING
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--lang=id-ID",
      "--window-size=1280,900",
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // gunakan fingerprint default (jangan spoof)
  await page.setUserAgent(await browser.userAgent());

  // debug console page
  page.on("console", msg => console.log("[page console]", msg.text()));
  page.on("requestfailed", req =>
    console.log(`[request failed] ${req.url()} - ${req.failure().errorText}`)
  );

  // navigate
  console.log("[info] Navigating to login page...");
  await page.goto("https://my.telkomsel.com/login/web", {
    waitUntil: "networkidle2",
  });

  // === input nomor hp ===
  const phone = await ask("Masukkan nomor Telkomsel (contoh: 08123456789): ");

  await page.waitForSelector("#loginMsisdnInput");
  await page.type("#loginMsisdnInput", phone, { delay: 80 });

  // === klik tombol login pakai real mouse event ===
  const loginBtn = await page.$('button[data-testid="loginBtn"]');
  const box = await loginBtn.boundingBox();

  console.log("[info] Clicking Login (real mouse)...");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
    delay: 120,
  });

  // === Tunggu OTP module muncul ===
  console.log("[info] Waiting OTP popup to load...");

  try {
    await page.waitForSelector("input[aria-label='Digit 1']", {
      timeout: 10000,
    });
    console.log("[info] OTP popup successfully detected!");
  } catch (e) {
    console.log("\n❌ OTP popup gagal muncul!");
    console.log("Kemungkinan besar fingerprint / Chrome kamu diblok.\n");

    await browser.close();
    return;
  }

  // === input OTP ===
  const otp = await ask("Masukkan OTP dari SMS: ");

  console.log("[info] Mengisi OTP...");
  for (let i = 0; i < otp.length; i++) {
    const digit = otp[i];

    await page.evaluate(
      (digit, idx) => {
        const el = document.querySelector(
          `input[aria-label='Digit ${idx + 1}']`
        );
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        setter.call(el, digit);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      },
      digit,
      i
    );

    await delay(120);
  }

  // === klik submit OTP ===
  console.log("[info] Klik submit OTP...");

  const submitBtn = await page.$x(
    "//button[contains(text(),'Submit') or @data-testid='btn']"
  );
  if (submitBtn.length > 0) {
    const sb = await submitBtn[0].boundingBox();
    await page.mouse.click(sb.x + sb.width / 2, sb.y + sb.height / 2);
  }

  console.log("🎉 OTP dikirim, login sukses!");
}

scraper();
