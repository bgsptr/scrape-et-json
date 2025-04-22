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

  const questionContent = {
    id: `102904`,
    question: "",
    body: "",
    comments: [],
  };

  const targetUrl = `https://www.examtopics.com/discussions/amazon/view/102904-exam-aws-certified-developer-associate-dva-c02/`;

  try {
    await driver.get(targetUrl);

    const titleElement = await driver.findElement(By.css(".discussion-list-header h1"));
    const titleText = await titleElement.getText();
    const titleToken = titleText.split(" ").slice(0, 7);
    const dataTitle = titleToken.join("").toLowerCase();

    if (dataTitle === "examawscertifieddeveloper-associatedva-c02") {
      const htmlElement = await driver.findElement(By.className("question-body"));
      questionContent.body = await htmlElement.getText();

      questionContent.question = titleText.split(" ").slice(9, 11).join(" ");

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

      // Write to file
      const folderPath = path.join("associate-developer-aws");
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fileName = `${questionContent.question.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-associate-developer-${questionContent.id}.json`;
      const filePath = path.join(folderPath, fileName);

      fs.writeFileSync(filePath, JSON.stringify(questionContent, null, 2));
      console.log(`✅ File saved: ${filePath}`);
    }
  } catch (error) {
    console.error("❌ Error while scraping:", error);
  } finally {
    await driver.quit();
  }
}

scraper();
