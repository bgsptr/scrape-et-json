import { Builder, By } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { path as chromedriverPath } from "chromedriver";
import fs from "fs";
import path from "path";

async function scraper() {
  const service = new chrome.ServiceBuilder(chromedriverPath);

  const options = new chrome.Options()
    .addArguments("--headless")
    .addArguments("--no-sandbox")
    .addArguments("--disable-dev-shm-usage")
    .addArguments("--ignore-certificate-errors")
    .addArguments("--disable-web-security");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  const scrapedQuestions = [];

  const startId = 102905; // set as you want
  const latestId = 103905; // latest updated id in exam web

  try {
    for (let i = startId; i <= latestId; i++) {
      const questionContent = {
        id: `${i}`,
        question: "",
        body: "",
        comments: [],
      };

      const targetUrl = `https://www.examtopics.com/discussions/amazon/view/${i}-exam-aws-certified-developer-associate-dva-c02-topic-1/`;
      console.log(`Scraping: ${targetUrl}`);

      try {
        await driver.get(targetUrl);

        const titleElement = await driver.findElement(By.css(".discussion-list-header h1"));
        const titleText = await titleElement.getText();
        const titleToken = titleText.split(" ").slice(0, 7);
        const dataTitle = titleToken.join("").toLowerCase();

        if (dataTitle === "examawscertifieddeveloper-associatedva-c02") {
          console.log("✅ Matching Title:", dataTitle);

          const htmlElement = await driver.findElement(By.className("question-body"));
          questionContent.body = await htmlElement.getText();

          questionContent.question = titleText.split(" ").slice(9, 11).join("-").toLowerCase();

          let replied = 0;

          const commentContainers = await driver.findElements(By.css(".comment-container"));
          for (const comment of commentContainers) {
            const commentData = {
              user: "",
              selectedAnswer: "",
              body: "",
              reply: [],
            };

            if (replied > 0) {
              replied = replied - 1;
              continue;
            }

            try {
              const headComment = await comment.findElement(By.css(".comment-head .comment-username"));
              commentData.user = await headComment.getText();
            } catch {}

            try {
              const selectedAnswer = await comment.findElement(By.css(".comment-body .comment-selected-answers span"));
              commentData.selectedAnswer = await selectedAnswer.getText();
            } catch {}

            try {
              const bodyComment = await comment.findElement(By.css(".comment-body .comment-content"));
              commentData.body = await bodyComment.getText();
            } catch {}

            try {
              const replyElements = await comment.findElements(By.css(".comment-body .comment-replies .comment-container"));
              for (const reply of replyElements) {
                try {
                  const replyUser = await reply.findElement(By.css(".comment-head .comment-username"));
                  const replyBody = await reply.findElement(By.css(".comment-body .comment-content"));
                  commentData.reply.push({
                    user: await replyUser.getText(),
                    body: await replyBody.getText(),
                  });

                  replied = replied + 1;
                } catch {}
              }
            } catch {}

            questionContent.comments.push(commentData);
          }

          scrapedQuestions.push(questionContent);

          // save to file
          const folderPath = path.join("associate-developer-aws");
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }

          const safeFileName = `${questionContent.question || "question_" + i}`
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();
          const fileName = `${safeFileName}-associate-developer.json`;
          const filePath = path.join(folderPath, fileName);

          fs.writeFileSync(filePath, JSON.stringify(questionContent, null, 2));
          console.log(`File saved: ${filePath}`);
        } else {
          console.log("Not matching:", dataTitle);
        }
      } catch (innerErr) {
        console.warn(`Failed to scrape ${targetUrl}:`, innerErr.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("Error while scraping:", error);
  } finally {
    await driver.quit();
  }
}

scraper();
