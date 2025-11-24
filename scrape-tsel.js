import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { path as chromedriverPath } from "chromedriver";
import fs from "fs";
import path from "path";

import readline from "readline";

async function scraper() {
  const service = new chrome.ServiceBuilder('/usr/local/bin/chromedriver');

  //const options = new chrome.Options()
  //  .addArguments("--headless")
  //  .addArguments("--no-sandbox")
  //  .addArguments("--disable-dev-shm-usage")
  //  .addArguments("--ignore-certificate-errors")
  //  .addArguments("--disable-web-security");

  const options = new chrome.Options()
  .addArguments("--no-sandbox")
  .addArguments("--disable-dev-shm-usage")
  .addArguments("--ignore-certificate-errors")
  .addArguments("--disable-web-security")
  .addArguments("--disable-blink-features=AutomationControlled")
  .addArguments("--window-size=1280,1600")
  .addArguments("--start-maximized")
  .excludeSwitches("enable-automation")
  .addArguments("--disable-infobars");


  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  const ask = (question) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => rl.question(question, ans => {
      rl.close();
      resolve(ans);
    }))
  }

  const authUrl = `https://my.telkomsel.com/login/web`;

  const rewardUrl = `https://my.telkomsel.com/app/loyalty-reward-details/SS25UUHQ4P15`;

  try {

    const phoneNo = await ask("Masukkan nomor telepon HP telkomsel (tanpa +62): ");

    await driver.get(authUrl);

    let phoneInput = await driver.wait(
      until.elementLocated(By.id("loginMsisdnInput")),
      10000
    );

    await phoneInput.clear();
    await phoneInput.sendKeys(phoneNo);

    let loginBtn = await driver.wait(
      until.elementLocated(By.css("button[data-testid='loginBtn']")),
      10000
    );
    await loginBtn.click();

    const otp = await ask("Masukkan OTP dari sms: ");

    //let otpInput = await driver.wait(
    //  until.elementLocated(By.css("input[type='tel']")),
    //  10000
    //);
    //await otpInput.sendKeys(otp);
    //
    //
    console.log("mengisi otp...");

    
    for (let i = 0; i < otp.length; i++) { 

      let otpInput = await driver.wait(
        until.elementLocated(By.xpath(`//input[@aria-label='Digit ${i+1}']`)),
        10000
      );

      await otpInput.sendKeys(otp[i]);
    }

    let otpVerifyBtn = await driver.wait(
      until.elementLocated(By.css("button[data-testid='btn']")),
      10000
    );
    await driver.wait(async () => {
      let disabled = await otpVerifyBtn.getAttribute("disabled");
      return disabled === null;
    }, 10000);
    await otpVerifyBtn.click();

    await driver.get(rewardUrl);

    let tukarBtn = await driver.wait(
      until.elementLocated(By.css("button[data-testid='btn']")),
      10000
    );
    await tukarBtn.click();

    console.log("Berhasil klik tombol Tukar!");
     //tukar_btn = WebDriverWait(driver, 10).until(
     //EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='btn'].Button__style__primary"))
     //);

    tukar_btn.click();

  } catch (error) {
    console.error("❌ Error while scraping:", error);
  } finally {
    await driver.quit();
  }
}

scraper();
