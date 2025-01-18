import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const userAgentStrings = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.3497.92 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
];

export const getPointLines = async () => {
  const url = `https://www.rotowire.com/picks/prizepicks/`;
  chromium.use(StealthPlugin());
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent:
      userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
  });
  const page = await context.newPage();
  await page.goto(url);

  await page.waitForSelector(".flex.gap-y-2.text-center.w-full");
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "NBA" }).nth(0).click();
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Points" }).click();
  await page.waitForTimeout(5000);

  // Scroll and scrape logic
  const playerData = [];
  const seenPlayers = new Set(); // To track unique players
  let previousHeight = 0;

  while (true) {
    // Scrape the visible cards
    const cards = await page.locator(
      "div.flex.text-left.bg-white.rounded-r.text-sm.relative.w-full"
    );

    const cardCount = await cards.count();
    for (let i = 0; i < cardCount; i++) {
      const playerName = await cards
        .nth(i)
        .locator("a.text-rw-600.font-semibold")
        .textContent();

      const pointsLine = await cards
        .nth(i)
        .locator("div.pb-1.px-0.flex.items-center.justify-start")
        .nth(0)
        .textContent();

      const teamName = await cards
        .nth(i)
        .locator("div.text-slate-700.text-sm.font-semibold")
        .textContent();

      const opponent = await cards
        .nth(i)
        .locator("div.text-slate-500.text-xs")
        .textContent();

      const playerKey = `${playerName.trim()}-${teamName.trim()}`; // Unique key

      if (!seenPlayers.has(playerKey)) {
        seenPlayers.add(playerKey);
        playerData.push({
          name: playerName.trim(),
          points: pointsLine.trim(),
          team: teamName.trim(),
          opponent: opponent.trim(),
        });
      }
    }

    // Scroll down
    const scrollHeight = await page.evaluate(() => {
      window.scrollBy(0, 2 * window.innerHeight);
      return document.documentElement.scrollHeight;
    });

    // Break if the page height stops increasing
    if (scrollHeight === previousHeight) break;
    previousHeight = scrollHeight;

    await page.waitForTimeout(2000); // Allow time for lazy loading
  }

  await browser.close();
  return playerData;
};

// (async () => {
//   const data = await getPointLines();
//   console.log(JSON.stringify(data));
// })();
