import { chromium, firefox } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// this page filters eligible players for a season by mpg and games played and outputs an array of their names

const userAgentStrings = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.3497.92 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
];

export const getAllCurrentPlayers = async (year, retries = 5) => {
  const url = `https://www.nba.com/stats/players/traditional?SeasonType=Regular+Season&dir=A&sort=MIN&Season=${year}`;
  chromium.use(StealthPlugin());
  const browser = await firefox.launch();
  const context = await browser.newContext({
    userAgent:
      userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
  });
  for (let attempt = 1; attempt <= retries; attempt++) {
    const page = await context.newPage();
    try {
      await page.goto(url);

      await page.waitForTimeout(5000);

      // await page.getByTitle("Add a custom filter").click();
      // await page.getByPlaceholder("Value").fill("DAL");

      await page.selectOption(
        ".Crom_cromSettings__ak6Hd > .Pagination_content__f2at7 > .Pagination_pageDropdown__KgjBU > div > label > div > select",
        "-1"
      );

      await page.waitForTimeout(3000);

      // await page.screenshot({ path: `nodejs_boxscore.png` });

      const filterPlayersByMins = await page.$$eval(
        ".Crom_container__C45Ti > table > tbody > tr",
        (playerRow) => {
          const data = [];
          playerRow.forEach((player) => {
            const playerName = player.querySelector(
              "td:nth-of-type(2) > a"
            ).innerText;
            const playerNameSplit = playerName.split(" ");
            data.push(`${playerNameSplit[0]} ${playerNameSplit[1]}`);
          });
          return data;
        }
      );
      await browser.close();
      return filterPlayersByMins;
      // return getLabels;
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
  await context.tracing.stop({ path: "trace.zip" });
  await browser.close();
};

// const test = async () => {
//   const data = await getAllCurrentPlayers("2020-21");
//   // console.log(JSON.stringify(data));
//   console.log(data.length);
// };
// getTeams();
// test();
// console.log(teamKeys);
// getAllRosters();
