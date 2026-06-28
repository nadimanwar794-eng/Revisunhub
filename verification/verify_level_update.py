
import asyncio
from playwright.async_api import async_playwright
import json
import time

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        )
        page = await context.new_page()

        # Define user data with Level System enabled
        user_data = {
            "id": "test-user-123",
            "name": "Level User",
            "email": "level@example.com",
            "role": "STUDENT",
            "credits": 100,
            "isPremium": False,
            "totalActiveDays": 15,
            "level": 3,
            "streak": 5,
            "lastLoginDate": "2023-10-27T10:00:00.000Z",
            "lastLoginRewardDate": "2023-10-27T10:00:00.000Z"
        }

        await page.add_init_script(f"""
            localStorage.setItem('nst_current_user', '{json.dumps(user_data)}');
            localStorage.setItem('nst_terms_accepted', 'true');
            localStorage.setItem('nst_has_seen_welcome', 'true');
            localStorage.setItem('nst_system_settings', JSON.stringify({{ isLevelSystemEnabled: true }}));
            localStorage.setItem('referral_shown_test-user-123', 'true');
        """)

        print("Navigating to app (5000)...")
        try:
            await page.goto("http://localhost:5000")

            # Wait for "Student App" or similar common text
            await page.wait_for_selector("text=Student App", timeout=20000)
            print("App loaded (Header found).")

            # Check for Level Badge next to Header
            # Using partial text match or closest element
            header_lvl = page.locator("h2:has-text('Student App')").locator("xpath=..").locator("text=LVL 3")

            if await header_lvl.count() > 0:
                 print("SUCCESS: Header Level Badge found.")
            else:
                 # Try general search
                 if await page.get_by_text("LVL 3").count() > 0:
                      print("SUCCESS: 'LVL 3' badge found somewhere on page.")
                 else:
                      print("FAILURE: 'LVL 3' badge NOT found.")
                      await page.screenshot(path="verification/level_fail_debug.png")

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="verification/error_debug.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
