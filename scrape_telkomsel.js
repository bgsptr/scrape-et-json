import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import readline from "readline";

// Aktifkan anti-bot stealth
puppeteer.use(StealthPlugin());

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function scraper() {

  console.log("🚀 Meluncurkan browser stealth...");

  const browser = await puppeteer.launch({
    headless: false,              // harus visible, agar aman
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--ignore-certificate-errors",
      "--window-size=1280,1600"
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();

  // Anti WebDriver detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const authUrl = "https://my.telkomsel.com/login/web";
  const rewardUrl = "https://my.telkomsel.com/app/loyalty-reward-details/SS25UUHQ4P15";

  try {

    // ============================================
    // 1. Input Nomor HP
    // ============================================

    const phone = await ask("Masukkan nomor Telkomsel (0812xxxx): ");
    await page.goto(authUrl, { waitUntil: "networkidle2" });

    await page.waitForSelector("#loginMsisdnInput");
    await page.type("#loginMsisdnInput", phone, { delay: 120 });

    await page.click("button[data-testid='loginBtn']");

    // ============================================
    // 2. Input OTP Manual via terminal
    // ============================================

    const otp = await ask("Masukkan OTP dari SMS: ");
    console.log("\nMengisi OTP...\n");

    for (let i = 0; i < otp.length; i++) {
      const selector = `input[aria-label="Digit ${i + 1}"]`;
      await page.waitForSelector(selector);

      await page.click(selector);
      await page.type(selector, otp[i], { delay: 150 });
    }

    // ============================================
    // 3. Klik Submit OTP
    // ============================================

    await page.waitForSelector("button[data-testid='btn']");
    await page.click("button[data-testid='btn']");

    console.log("OTP dikirim. Menunggu redirect...\n");

    // Tunggu redirect URL SPA
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 });

    console.log("Login sukses! 🎉");

    // ============================================
    // 4. Menuju Halaman Reward
    // ============================================

    await page.goto(rewardUrl, { waitUntil: "networkidle2" });

    await page.waitForSelector("button[data-testid='btn']");
    await page.click("button[data-testid='btn']");

    console.log("\n🎉 Berhasil klik tombol Tukar!\n");

  } catch (err) {
    console.error("\n❌ ERROR:", err);
  } finally {
    await browser.close();
  }
}

scraper();
