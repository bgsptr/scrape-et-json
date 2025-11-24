import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import readline from "readline";

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function scraper() {
  // === Chrome Options Anti-Bot ===
  const options = new chrome.Options()
    .addArguments("--no-sandbox")
    .addArguments("--disable-dev-shm-usage")
    .addArguments("--disable-blink-features=AutomationControlled")
    .addArguments("--ignore-certificate-errors")
    .addArguments("--disable-web-security")
    .addArguments("--disable-infobars")
    .excludeSwitches("enable-automation")
    .addArguments("--window-size=1280,1600");  // jangan headless!

  const service = new chrome.ServiceBuilder("/usr/local/bin/chromedriver");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  const authUrl = "https://my.telkomsel.com/login/web";
  const rewardUrl = "https://my.telkomsel.com/app/loyalty-reward-details/SS25UUHQ4P15";

  try {
    // ============================================
    // 1. INPUT NOMOR HP DARI TERMINAL
    // ============================================
    const phone = await ask("Masukkan nomor Telkomsel (contoh: 08123456789): ");

    await driver.get(authUrl);

    const phoneInput = await driver.wait(
      until.elementLocated(By.id("loginMsisdnInput")),
      3000
    );
    await phoneInput.sendKeys(phone);

    const loginBtn = await driver.wait(
      until.elementLocated(By.css('button[data-testid="loginBtn"]')),
      3000
    );
    await loginBtn.click();

    // ============================================
    // 2. MASUKKAN OTP DARI TERMINAL (TANPA UI)
    // ============================================
    const otp = await ask("Masukkan OTP dari SMS: ");

    console.log("\n💡 Mengisi OTP langsung ke DOM (bukan UI)...\n");

    for (let i = 0; i < otp.length; i++) {
      const digit = otp[i];
      const script = `
        const input = document.querySelector("input[aria-label='Digit ${i + 1}']");
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, "value"
          ).set;
          setter.call(input, "${digit}");
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `;
      await driver.executeScript(script);
      await driver.sleep(100);
    }

    // ============================================
    // 3. KLIK TOMBOL SUBMIT OTP
    // ============================================
    const otpBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(),'Submit') or @data-testid='btn']")),
      2000
    );
    await driver.wait(async () => {
       return (await otpBtn.getAttribute("disabled")) === null;
    }, 2000);
    await otpBtn.click();

    console.log("OTP berhasil dikirim. Login success.\n");

    // ============================================
    // 4. MENUJU HALAMAN REWARD
    // ============================================
    await driver.get(rewardUrl);

    const tukarBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(),'Tukar')]")),
      2000000
    );
    await tukarBtn.click();

    console.log("\n🎉 Berhasil klik tombol Tukar!\n");

  } catch (err) {
    console.error("\n❌ Error:", err);
  } finally {
    await driver.quit();
  }
}

scraper();
