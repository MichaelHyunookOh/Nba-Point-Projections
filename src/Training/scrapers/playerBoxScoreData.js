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

export const playerBoxScoreData = async (player, year, retries = 7) => {
  const url = `https://www.nba.com/stats/players/traditional?SeasonType=Regular+Season&dir=A&sort=MIN&Season=${year}`;
  const baseUrl = "https://www.nba.com";
  chromium.use(StealthPlugin());
  const browser = await firefox.launch();
  const context = await browser.newContext({
    userAgent:
      userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
  });

  // Start tracing for diagnostics
  // await context.tracing.start({ screenshots: true, snapshots: true });

  for (let attempt = 1; attempt <= retries; attempt++) {
    const page = await context.newPage();
    try {
      PlaywrightBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        blocker.enableBlockingInPage(page);
      });
      page.setDefaultTimeout(30000);
      await page.goto(url);
      await page.waitForSelector(".Block_blockContent__6iJ_n");
      await page.waitForTimeout(2000);
      await page.reload();

      // Wait for player name and click
      await page.waitForSelector(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select"
      );
      await page.waitForTimeout(4000);
      await page.selectOption(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select",
        "-1"
      );
      const href = await page
        .locator(`a:has-text("${player}")`)
        .getAttribute("href");
      if (href) {
        const fullUrl = `${baseUrl}${href}player`;
        await page.goto(fullUrl);
      } else {
        console.error(`Link not found for ${player}`);
      }
      // await page.locator(`text=${player}`).click();

      // Navigate to "Advanced Box Scores" and select season filters
      await page.locator(".PlayerStats_nav__751j5 > div > button").click();
      await page.locator("text=Advanced Box Scores").click();
      await page.waitForTimeout(2000);
      await page
        .locator(
          ".MaxWidthContainer_mwc__ID5AG > section:nth-of-type(2) > div > div > div:nth-of-type(1) select"
        )
        .selectOption(year);
      await page.waitForTimeout(2000);
      await page
        .locator(
          ".MaxWidthContainer_mwc__ID5AG > section:nth-of-type(2) > div > div > div:nth-of-type(2) select"
        )
        .selectOption("Regular Season");
      await page.waitForTimeout(2000);
      await page.reload();

      // If pagination dropdown is visible, set to show all pages
      const paginationDropdownTrad = page.locator(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU select"
      );
      if (
        (await paginationDropdownTrad.isVisible()) &&
        (await paginationDropdownTrad.isEnabled())
      ) {
        await paginationDropdownTrad.selectOption("-1");
      }

      await page.waitForSelector(".PlayerSummary_mainInnerBio__JQkoj");

      const gamePlayerDesc = await page.$$eval(
        ".PlayerSummary_hw__HNuGb",
        (rows) =>
          rows.map((row) => ({
            height: row.querySelector(
              ".PlayerSummary_flexTop__g8SVG > div:nth-of-type(1) .PlayerSummary_playerInfoValue__JS8_v"
            ).innerText,
            weight: row.querySelector(
              ".PlayerSummary_flexTop__g8SVG > div:nth-of-type(3) .PlayerSummary_playerInfoValue__JS8_v"
            ).innerText,
            dob: row.querySelector(
              ".PlayerSummary_flexBlock___CyTE > div:nth-of-type(3) .PlayerSummary_playerInfoValue__JS8_v"
            ).innerText,
          }))
      );

      // Retrieve labels and game logs for each stats section
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
      const getLabelsTraditional = await getLabels(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );
      const gameLogsTraditional = await getGameLogs(
        ".Crom_container__C45Ti > table > tbody > tr"
      );

      // Advanced stats section
      await page
        .locator(".PlayerStats_nav__751j5 > div:nth-of-type(2) button")
        .click();
      await page.getByRole("button", { name: "Advanced", exact: true }).click();
      await page.waitForTimeout(3000);
      await page
        .locator(
          ".MaxWidthContainer_mwc__ID5AG > section:nth-of-type(2) > div > div > div:nth-of-type(1) select"
        )
        .selectOption(year);
      await page.waitForTimeout(2000);
      await page
        .locator(
          ".MaxWidthContainer_mwc__ID5AG > section:nth-of-type(2) > div > div > div:nth-of-type(2) select"
        )
        .selectOption("Regular Season");
      await page.waitForTimeout(2000);
      await page.reload();
      const paginationDropdownAdv = page.locator(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU select"
      );
      if (
        (await paginationDropdownTrad.isVisible()) &&
        (await paginationDropdownTrad.isEnabled())
      ) {
        await paginationDropdownTrad.selectOption("-1");
      }
      await page.waitForSelector(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );

      const getLabelsAdvanced = await getLabels(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );
      const gameLogsAdvanced = await getGameLogs(
        ".Crom_container__C45Ti > table > tbody > tr"
      );

      // Misc stats section
      await page
        .locator(".PlayerStats_nav__751j5 > div:nth-of-type(2) button")
        .click();
      await page.getByRole("button", { name: "Misc", exact: true }).click();
      await page.waitForTimeout(3000);
      await page
        .locator(
          ".MaxWidthContainer_mwc__ID5AG > section:nth-of-type(2) > div > div > div:nth-of-type(1) select"
        )
        .selectOption(year);
      await page.waitForTimeout(2000);
      await page
        .locator(
          ".MaxWidthContainer_mwc__ID5AG > section:nth-of-type(2) > div > div > div:nth-of-type(2) select"
        )
        .selectOption("Regular Season");
      await page.waitForTimeout(2000);
      await page.reload();
      const paginationDropdownMisc = page.locator(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU select"
      );
      if (
        (await paginationDropdownTrad.isVisible()) &&
        (await paginationDropdownTrad.isEnabled())
      ) {
        await paginationDropdownTrad.selectOption("-1");
      }
      await page.waitForSelector(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );

      const getLabelsMisc = await getLabels(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );
      const gameLogsMisc = await getGameLogs(
        ".Crom_container__C45Ti > table > tbody > tr"
      );

      // Scoring stats section
      await page
        .locator(".PlayerStats_nav__751j5 > div:nth-of-type(2) button")
        .click();
      await page.getByRole("button", { name: "Scoring", exact: true }).click();
      await page.waitForTimeout(3000);
      await page
        .locator(
          ".MaxWidthContainer_mwc__ID5AG > section:nth-of-type(2) > div > div > div:nth-of-type(1) select"
        )
        .selectOption(year);
      await page.waitForTimeout(2000);
      await page
        .locator(
          ".MaxWidthContainer_mwc__ID5AG > section:nth-of-type(2) > div > div > div:nth-of-type(2) select"
        )
        .selectOption("Regular Season");
      await page.waitForTimeout(2000);
      await page.reload();
      const paginationDropdownScoring = page.locator(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU select"
      );
      if (
        (await paginationDropdownTrad.isVisible()) &&
        (await paginationDropdownTrad.isEnabled())
      ) {
        await paginationDropdownTrad.selectOption("-1");
      }
      await page.waitForSelector(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );
      const getLabelsScoring = await getLabels(
        ".Crom_container__C45Ti > table > thead > tr > th"
      );
      const gameLogsScoring = await getGameLogs(
        ".Crom_container__C45Ti > table > tbody > tr"
      );

      const [
        boxScoreByGameTraditional,
        boxScoreByGameAdvanced,
        boxScoreByGameMisc,
        boxScoreByGameScoring,
      ] = await Promise.all([
        addLabels(getLabelsTraditional, gameLogsTraditional).then((result) =>
          result.reverse()
        ),
        addLabels(getLabelsAdvanced, gameLogsAdvanced).then((result) =>
          result.reverse()
        ),
        addLabels(getLabelsMisc, gameLogsMisc).then((result) =>
          result.reverse()
        ),
        addLabels(getLabelsScoring, gameLogsScoring).then((result) =>
          result.reverse()
        ),
      ]);

      // const dataSets = [
      //   boxScoreByGameTraditional,
      //   boxScoreByGameAdvanced,
      //   boxScoreByGameMisc,
      //   boxScoreByGameScoring,
      // ];

      const mergeBoxScores = (commonKey, ...statTypes) => {
        const statsMaps = statTypes.map(
          (statsArray) =>
            new Map(statsArray.map((game) => [game[commonKey], game]))
        );

        return statTypes[0].map((baseGame) => {
          const mergedGame = { ...baseGame };

          statsMaps.slice(1).forEach((statsMap) => {
            const additionalGame = statsMap.get(baseGame[commonKey]);
            if (additionalGame) {
              Object.assign(mergedGame, additionalGame);
            }
          });

          return mergedGame;
        });
      };

      const mergedBoxScores = mergeBoxScores(
        "MATCHUP",
        boxScoreByGameTraditional,
        boxScoreByGameAdvanced,
        boxScoreByGameMisc,
        boxScoreByGameScoring
      );

      const finalPlayerData = mergedBoxScores.map((item) => ({
        ...item,
        height: gamePlayerDesc[0].height,
        weight: gamePlayerDesc[0].weight,
        dob: gamePlayerDesc[0].dob,
        name: player,
      }));
      if (hasAllKeys(finalPlayerData[0])) {
        // await context.tracing.stop({ path: "trace.zip" });
        await browser.close();
        return finalPlayerData;
      } else if (attempt < retries) {
        console.warn(
          `Attempt ${attempt} for ${player}: Incomplete data structure detected. Retrying...`
        );
      } else {
        console.warn(
          `Returning incomplete data for ${player} after ${retries} attempts.`
        );
        // await context.tracing.stop({ path: "trace.zip" });
        await browser.close();
        console.log(`status failed for ${player}`);
        // return {
        //   status: "failed",
        //   player,
        //   testObj: finalPlayerData[0],
        //   getLabelsAdvanced,
        //   gameLogsAdvanced,
        //   boxScoreByGameAdvanced,
        //   getLabelsMisc,
        //   gameLogsMisc,
        //   boxScoreByGameMisc,
        //   getLabelsScoring,
        //   gameLogsScoring,
        //   boxScoreByGameScoring,
        // };
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${player}`, error);
      if (attempt === retries) {
        // await context.tracing.stop({ path: "trace.zip" });
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
  // await context.tracing.stop({ path: "trace.zip" });
  await browser.close();
};

// const test = async () => {
//   const data = await playerBoxScoreData("Jonas Valančiūnas", "2022-23");
//   console.log(JSON.stringify(data));
// };
// getTeams();
// test();
// console.log(teamKeys);
// getAllRosters();
