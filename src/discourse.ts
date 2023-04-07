import puppeteer, { Browser, Page } from 'puppeteer';

const discourseUrl = 'https://gov.uniswap.org/latest';

async function checkFooterMessage(page: Page) {
    const footerMessage = await page.$('div.footer-message');
    return !!footerMessage;
}

// https://stackoverflow.com/a/53527984/440432
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const timer = setInterval(async () => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollTo(0, scrollHeight);
        const isFooterMessagePresent = await checkFooterMessage(page);
        if (isFooterMessagePresent) {
          console.log("There are no more latest topics!");
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function getPageDetails(browser: Browser, url: string) {
  const page = await browser.newPage();
  await page.goto(url);
  await page.setViewport({
    width: 1200,
    height: 800,
  });

  await autoScroll(page);

  const content = await page.$eval('div.container.posts', (e) => e.textContent);

  await page.close();

  return content;
}

// https://stackoverflow.com/a/55388485/440432
async function getHrefs(page: Page, selector: string) {
  return await page.$$eval(selector, (anchors) => [].map.call(anchors, (a) => a.href));
}

async function discourse() {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto(discourseUrl);
  await page.setViewport({
    width: 1200,
    height: 800,
  });

  await autoScroll(page);

  const hrefs: string[] = await getHrefs(page, 'tr.topic-list-item > td.main-link > span > a');

  console.log("total links:", hrefs.length);

  const firstTen = hrefs.slice(-10);

  console.log('firstTen : ', firstTen);

  for (const url of firstTen) {
    const content = await getPageDetails(browser, url);
    console.log('content : ', content);
  }

  await page.screenshot({
    path: 'yoursite.png',
    fullPage: true,
  });

  await browser.close();
}

discourse();
