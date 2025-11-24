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

const delay = ms => new Promise(r => setTimeout(r, ms));

async function scraper() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 1600 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-infobars",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();

  const authUrl = "https://my.telkomsel.com/login/web";
  const rewardUrl =
    "https://my.telkomsel.com/app/loyalty-reward-details/SS25UUHQ4P15";

  try {
    // ========================================================
    // 1. Input nomor HP
    // ========================================================
    const phone = await ask("Masukkan nomor Telkomsel (contoh: 08123456789): ");

    await page.goto(authUrl, { waitUntil: "networkidle2" });

    await page.waitForSelector("#loginMsisdnInput");
    await page.type("#loginMsisdnInput", phone, { delay: 80 }); // FIX HERE

    await page.locator('button[data-testid="loginBtn"]').wait();
    await page.locator('button[data-testid="loginBtn"]').click();

    // ========================================================
    // 2. Input OTP via DOM setter
    // ========================================================
    const otp = await ask("Masukkan OTP dari SMS: ");
    console.log("\n💡 Mengisi OTP langsung ke DOM...\n");

    for (let i = 0; i < otp.length; i++) {
      const digit = otp[i];

      await page.evaluate(
        (digit, index) => {
          const input = document.querySelector(
            `input[aria-label='Digit ${index + 1}']`
          );
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value"
            ).set;
            setter.call(input, digit);
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        },
        digit,
        i
      );

      await delay(100);
    }

    // ========================================================
    // 3. Klik tombol Submit OTP
    // ========================================================
    console.log("Klik tombol Submit OTP...");

    const submitBtn = page.locator(
      "xpath=//button[contains(text(),'Submit') or @data-testid='btn']"
    );

    await submitBtn.wait();
    await submitBtn.click();

    console.log("OTP berhasil dikirim. Login success.\n");

    // ========================================================
    // 4. Buka halaman Reward dan klik Tukar
    // ========================================================
    await page.goto(rewardUrl, { waitUntil: "networkidle2" });

    const tukarBtn = page.locator("xpath=//button[contains(text(),'Tukar')]");
    await tukarBtn.wait();
    await tukarBtn.click();

    console.log("\n🎉 Berhasil klik tombol Tukar!\n");
  } catch (err) {
    console.error("\n❌ Error:", err);
  } finally {
    await browser.close();
  }
}

scraper();
