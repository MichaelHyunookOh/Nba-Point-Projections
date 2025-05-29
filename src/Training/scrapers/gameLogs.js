import { chromium, firefox } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { sleep } from "../../Helpers/sleep.js";
import { PlaywrightBlocker } from "@ghostery/adblocker-playwright";
import { hasAllKeys } from "../util/teamKeys.js";

const userAgentStrings = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.3497.92 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
];

export const getGameLogs = async (year, retries = 5) => {
  const url = `https://www.nba.com/stats/teams/boxscores-traditional`;
  const browser = await firefox.launch();
  const context = await browser.newContext({
    userAgent:
      userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
  });
  for (let attempt = 1; attempt <= retries; attempt++) {
    const page = await context.newPage();
    await page.setViewportSize({
      width: 800,
      height: 1500,
    });
    try {
      PlaywrightBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        blocker.enableBlockingInPage(page);
      });
      // await context.tracing.start({ screenshots: true, snapshots: true });
      await page.goto(url);

      await page.waitForTimeout(3000);
      await page.reload();
      await page.waitForTimeout(3000);

      // await page.getByTitle("Add a custom filter").click();
      // await page.getByPlaceholder("Value").fill("DAL")
      await page.selectOption(
        ".Block_block__62M07 > div > div > div:nth-of-type(1) > label > div > select",
        year
      );
      await page.waitForTimeout(2000);
      await page.selectOption(
        ".Block_block__62M07 > div > div > div:nth-of-type(2) > label > div > select",
        "Regular Season"
      );
      await page.waitForTimeout(2000);

      await page.reload();

      await page.waitForTimeout(2000);

      if (
        await page.isVisible(
          ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select"
        )
      ) {
        await page.selectOption(
          ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select",
          "-1"
        );
      }

      await page.waitForTimeout(3000);

      const getLabelsTraditional = await page.$$eval(
        ".Crom_container__C45Ti > table > thead > tr > th",
        (labels) => {
          const data = [];
          labels.forEach((label) => {
            const formatLabels = (input) => {
              if (input === "GAME DATE") {
                return "DATE";
              }
              const cleansedInput = input.replace(/\n/g, "");
              return cleansedInput.replace(/\s/g, "");
            };
            const title = label.innerText;
            const formattedLabel = formatLabels(title);
            data.push(formattedLabel);
          });
          return data;
        }
      );

      const gameLogsTraditional = await page.$$eval(
        ".Crom_container__C45Ti > table > tbody > tr",
        (gameRow) => {
          const data = [];
          gameRow.forEach((game) => {
            const rowData = [];
            const team = game.querySelectorAll("td");
            team.forEach((row) => {
              const gameInfo = row.textContent.trim();
              rowData.push(gameInfo);
            });
            data.push(rowData);
          });
          return data;
        }
      );
      await page.waitForTimeout(2000);
      await page
        .locator(".StatsQuickNav_nav__uFyr_ > div:nth-of-type(3) > button")
        .click();

      await page.waitForTimeout(4000);

      await page.getByRole("button", { name: "Advanced", exact: true }).click();
      await page.waitForTimeout(4000);
      await page.selectOption(
        ".Block_block__62M07 > div > div > div:nth-of-type(1) > label > div > select",
        year
      );
      await page.waitForTimeout(4000);
      await page.selectOption(
        ".Block_block__62M07 > div > div > div:nth-of-type(2) > label > div > select",
        "Regular Season"
      );
      await page.waitForTimeout(4000);
      await page.reload();
      await page.waitForTimeout(4000);
      if (
        await page.isVisible(
          ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select"
        )
      ) {
        await page.selectOption(
          ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select",
          "-1"
        );
      }
      await page.waitForTimeout(3000);
      const getLabelsAdvanced = await page.$$eval(
        ".Crom_container__C45Ti > table > thead > tr > th",
        (labels) => {
          const data = [];
          labels.forEach((label) => {
            const formatLabels = (input) => {
              if (input.includes("DATE")) {
                return "DATE";
              }
              const cleansedInput = input.replace(/\n/g, "");
              return cleansedInput.replace(/\s/g, "");
            };
            const title = label.innerText;
            const formattedLabel = formatLabels(title);
            data.push(formattedLabel);
          });
          return data;
        }
      );

      const gameLogsAdvanced = await page.$$eval(
        ".Crom_container__C45Ti > table > tbody > tr",
        (gameRow) => {
          const data = [];
          gameRow.forEach((game) => {
            const rowData = [];
            const team = game.querySelectorAll("td");
            team.forEach((row) => {
              const gameInfo = row.textContent.trim();
              rowData.push(gameInfo);
            });
            data.push(rowData);
          });
          return data;
        }
      );
      await page.waitForTimeout(2000);
      await page
        .locator(".StatsQuickNav_nav__uFyr_ > div:nth-of-type(3) > button")
        .click();

      await page.waitForTimeout(2000);

      await page.getByRole("button", { name: "Misc", exact: true }).click();
      await page.waitForTimeout(2000);
      await page.selectOption(
        ".Block_block__62M07 > div > div > div:nth-of-type(1) > label > div > select",
        year
      );
      await page.waitForTimeout(4000);
      await page.selectOption(
        ".Block_block__62M07 > div > div > div:nth-of-type(2) > label > div > select",
        "Regular Season"
      );
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForTimeout(2000);
      if (
        await page.isVisible(
          ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select"
        )
      ) {
        await page.selectOption(
          ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select",
          "-1"
        );
      }
      const getLabelsMisc = await page.$$eval(
        ".Crom_container__C45Ti > table > thead > tr > th",
        (labels) => {
          const data = [];
          labels.forEach((label) => {
            const formatLabels = (input) => {
              if (input.includes("DATE")) {
                return "DATE";
              }
              const cleansedInput = input.replace(/\n/g, "");
              return cleansedInput.replace(/\s/g, "");
            };
            const title = label.innerText;
            const formattedLabel = formatLabels(title);
            data.push(formattedLabel);
          });
          return data;
        }
      );

      const gameLogsMisc = await page.$$eval(
        ".Crom_container__C45Ti > table > tbody > tr",
        (gameRow) => {
          const data = [];
          gameRow.forEach((game) => {
            const rowData = [];
            const team = game.querySelectorAll("td");
            team.forEach((row) => {
              const gameInfo = row.textContent.trim();
              rowData.push(gameInfo);
            });
            data.push(rowData);
          });
          return data;
        }
      );
      const addLabelsTraditional = gameLogsTraditional.map((game) => {
        return getLabelsTraditional.reduce((obj, label, index) => {
          obj[label] = game[index]; // Map each label to the corresponding game value
          return obj;
        }, {});
      });
      const boxScoreByGameTraditional = addLabelsTraditional.reverse();
      const addLabelsAdvanced = gameLogsAdvanced.map((game) => {
        return getLabelsAdvanced.reduce((obj, label, index) => {
          obj[label] = game[index]; // Map each label to the corresponding game value
          return obj;
        }, {});
      });
      const boxScoreByGameAdvanced = addLabelsAdvanced.reverse();
      const addLabelsMisc = gameLogsMisc.map((game) => {
        return getLabelsMisc.reduce((obj, label, index) => {
          obj[label] = game[index]; // Map each label to the corresponding game value
          return obj;
        }, {});
      });
      const boxScoreByGameMisc = addLabelsMisc.reverse();

      const mergeBoxScores = (commonKey1, commonKey2, ...statTypes) => {
        // Create an array of maps for each stat type based on the common key (e.g., MATCHUP)
        const statsMaps = statTypes.map(
          (statsArray) =>
            new Map(
              statsArray.map((game) => [
                `${game[commonKey1]}-${game[commonKey2]}`,
                game,
              ])
            )
        );

        // Merge all stats types using the common key
        return statTypes[0].map((baseGame) => {
          // Start with the first stat type as the base
          const mergedGame = { ...baseGame };

          // Iterate through each stats map and merge data from the corresponding game
          statsMaps.slice(1).forEach((statsMap) => {
            const additionalGame = statsMap.get(
              `${baseGame[commonKey1]}-${baseGame[commonKey2]}`
            );
            if (additionalGame) {
              Object.assign(mergedGame, additionalGame);
            }
          });

          return mergedGame;
        });
      };
      const mergedBoxScores = mergeBoxScores(
        "MATCHUP",
        "DATE",
        boxScoreByGameTraditional,
        boxScoreByGameAdvanced,
        boxScoreByGameMisc
      );

      if (hasAllKeys(mergedBoxScores[0])) {
        // await context.tracing.stop({ path: "trace.zip" });
        await browser.close();
        return mergedBoxScores;
      } else if (attempt < retries) {
        console.warn(
          `Attempt ${attempt}: Incomplete data structure detected. Retrying...`
        );
      } else {
        console.warn(`Returning incomplete data after ${retries} attempts.`);
        // await context.tracing.stop({ path: "trace.zip" });
        await browser.close();
        return {
          status: "failed",
          testObj: mergedBoxScores[0],
        };
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed`, error);
      if (attempt === retries) {
        // await context.tracing.stop({ path: "trace.zip" });
        await browser.close();
        throw new Error(`All ${retries} attempts failed`);
      }
    } finally {
      if (!page.isClosed()) {
        await page.close();
      }
    }
  }
  // await context.tracing.stop({ path: "trace.zip" });
  await browser.close();
};

// const test = async () => {
//   const data = await getGameLogs("2024-25");
//   console.log(JSON.stringify(data));
// };
// getTeams();
// test();
// console.log(teamKeys);
// getAllRosters();
