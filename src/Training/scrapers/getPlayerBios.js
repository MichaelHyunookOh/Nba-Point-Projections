import { chromium, firefox } from "playwright-extra";
import { getEligiblePlayers } from "./getEligiblePlayers.js";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { addLabels } from "../util/addLabels.js";
import { sleep } from "../../Helpers/sleep.js";
import { PlaywrightBlocker } from "@ghostery/adblocker-playwright";
import { hasAllKeys } from "../util/playerKeys.js";
import { validateDataPresence } from "../util/validateDataPresence.js";

// this page filters eligible players for a season by mpg and games played and outputs an array of their names

const userAgentStrings = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.3497.92 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
];

export const playerBios = async (year, retries = 5) => {
  const url = `https://www.nba.com/stats/players/bio?Season=${year}`;
  const baseUrl = "https://www.nba.com";
  chromium.use(StealthPlugin());
  const browser = await firefox.launch();
  const context = await browser.newContext({
    userAgent:
      userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
  });
  // Start tracing for diagnostics
  await context.tracing.start({ screenshots: true, snapshots: true });

  for (let attempt = 1; attempt <= retries; attempt++) {
    const page = await context.newPage();
    try {
      PlaywrightBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        blocker.enableBlockingInPage(page);
      });
      page.setDefaultTimeout(30000);
      await page.goto(url);
      await page.waitForSelector(".Block_blockContent__6iJ_n");
      await page.reload();
      await page.waitForSelector(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select"
      );
      await page.selectOption(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select",
        "-1"
      );
      await page.waitForTimeout(2000);

      const getLabels = async (selector) => {
        return page.$$eval(selector, (labels) =>
          labels.map((label) => label.innerText.trim().replace(/\n|\s/g, ""))
        );
      };

      const getGameLogs = async (selector) => {
        return page.$$eval(selector, (gameRow) =>
          gameRow.map((game) =>
            Array.from(game.querySelectorAll("td"), (row) =>
              row.textContent.trim()
            )
          )
        );
      };

      await page.waitForSelector(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );

      // Traditional stats section
      const getLabelsBios = await getLabels(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );
      const getBios = await getGameLogs(
        ".Crom_container__C45Ti > table > tbody > tr"
      );

      const [seasonPlayerBios] = await Promise.all([
        addLabels(getLabelsBios, getBios),
      ]);
      return seasonPlayerBios;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${player}`, error);
      if (attempt === retries) {
        await browser.close();
        throw new Error(`All ${retries} attempts failed for ${player}`);
      }
    } finally {
      if (!page.isClosed()) {
        await page.close();
      }
    }
    await sleep(2000);
  }
  await browser.close();
};

const test = async () => {
  const data = await playerBios("2024-25");
  console.log(JSON.stringify(data));
};
// getTeams();
test();
// console.log(teamKeys);
// getAllRosters();
