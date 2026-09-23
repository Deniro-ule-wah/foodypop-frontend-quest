import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results: Record<string, string> = {};
  
  function record(name: string, pass: boolean, detail: string = "") {
    results[name] = pass ? "PASS" : "FAIL";
    console.log(`${pass ? "✓" : "✗"} ${name}: ${results[name]}${detail ? " — " + detail : ""}`);
  }
  
  try {
    // === TEST 1: Homepage loads ===
    console.log("Navigating to homepage...");
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    const homeTitle = await page.title();
    record("Homepage loads", homeTitle.length > 0, `title="${homeTitle}"`);
    
    const hasFoodyPop = await page.locator("text=FoodyPop").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Brand logo visible on home", hasFoodyPop);
    
    // === TEST 2: Direct dish URL loads ===
    console.log("Navigating to dish page...");
    await page.goto(DISH_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    const dishTitle = await page.title();
    record("Dish page loads", dishTitle.length > 0, `title="${dishTitle}"`);
    
    // Check it's not a 404
    const is404 = await page.locator("text=not found,NotFound").first().isVisible({ timeout: 3000 }).catch(() => false);
    record("Dish page not 404", !is404);
    
    // === TEST 3: Media renders ===
    const mediaVisible = await page.locator("img[alt*='Dish'], img[class*='object-cover']").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Dish media area visible", mediaVisible);
    
    // === TEST 4: Dish name visible ===
    const nameVisible = await page.locator("h1").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Dish name (h1) visible", nameVisible);
    
    // === TEST 5: Taste gestures present ===
    const tasteLabels = ["Delicious", "Sweet", "Bitter", "Sour", "Salty", "Spicy", "Refreshing", "Crispy", "Rich", "Filling"];
    const missingTastes: string[] = [];
    for (const t of tasteLabels) {
      const visible = await page.locator(`text=${t}`).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (!visible) missingTastes.push(t);
    }
    record("All 10 taste gestures", missingTastes.length === 0, missingTastes.length ? `Missing: ${missingTastes.join(", ")}` : "");
    
    // === TEST 6: Price visible ===
    const priceVisible = await page.locator("text=KES").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Price (KES) visible", priceVisible);
    
    // === TEST 7: Follow button present ===
    const followBtn = await page.locator("text=Follow dish,Unfollow").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Follow/Unfollow button", followBtn);
    
    // === TEST 8: Add to cart button ===
    const cartBtn = await page.locator("text=Add to cart").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Add to cart button", cartBtn);
    
    // === TEST 9: Next/Prev dish navigation ===
    const prevNav = await page.locator("text=← Previous").first().isVisible({ timeout: 5000 }).catch(() => false);
    const nextNav = await page.locator("text=Next →").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Previous dish nav", prevNav);
    record("Next dish nav", nextNav);
    
    // === TEST 10: No errors in page content ===
    const pageContent = await page.content();
    record("No 'BrandLogo is not defined'", !pageContent.includes("BrandLogo is not defined"));
    record("No 'useLocation is not defined'", !pageContent.includes("useLocation is not defined"));
    record("No ReferenceError in HTML", !/ReferenceError/.test(pageContent));
    
    // === TEST 11: Mobile viewport (390×844) ===
    console.log("Testing mobile viewport...");
    const mobilePage = await browser.newPage();
    await mobilePage.setViewportSize({ width: 390, height: 844 });
    await mobilePage.goto(DISH_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await mobilePage.waitForTimeout(2000);
    
    const mobileH1 = await mobilePage.locator("h1").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Mobile: h1 visible", mobileH1);
    
    const mobileOverflow = await mobilePage.evaluate(() => {
      const body = document.body;
      return body.scrollWidth > body.clientWidth * 1.05;
    });
    record("Mobile: no horizontal overflow", !mobileOverflow);
    
    await mobilePage.close();
    
    // === TEST 12: Desktop viewport (1440×900) ===
    console.log("Testing desktop viewport...");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1000);
    const desktopOk = await page.locator("h1").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Desktop (1440×900): renders", desktopOk);
    
    // === TEST 13: Tablet viewport (768×1024) ===
    console.log("Testing tablet viewport...");
    const tabletPage = await browser.newPage();
    await tabletPage.setViewportSize({ width: 768, height: 1024 });
    await tabletPage.goto(DISH_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await tabletPage.waitForTimeout(1000);
    const tabletH1 = await tabletPage.locator("h1").first().isVisible({ timeout: 5000 }).catch(() => false);
    record("Tablet (768×1024): h1 visible", tabletH1);
    await tabletPage.close();
    
    // === Summary ===
    console.log("\n=== BROWSER TEST SUMMARY ===");
    const passes = Object.values(results).filter(v => v === "PASS").length;
    const fails = Object.values(results).filter(v => v === "FAIL").length;
    const total = Object.keys(results).length;
    console.log(`Passed: ${passes}/${total}, Failed: ${fails}/${total}`);
    
    for (const [name, status] of Object.entries(results)) {
      console.log(`  ${status} — ${name}`);
    }
    
    console.log(`\nProduction URL: ${URL}`);
    console.log(`Dish URL: ${DISH_URL}`);
    
  } catch (e) {
    console.error("Test run error:", e);
    record("Test run completed", false, String(e));
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
