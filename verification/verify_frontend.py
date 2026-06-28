from playwright.sync_api import sync_playwright
import time
import json

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 412, 'height': 915}) # Mobile view
        page = context.new_page()

        # 1. Setup User
        user = {
            "id": "user-1",
            "name": "Test Student",
            "role": "STUDENT",
            "classLevel": "10",
            "board": "CBSE",
            "isPremium": True,
            "subscriptionTier": "MONTHLY",
            "subscriptionLevel": "ULTRA",
            "subscriptionEndDate": "2099-12-31T00:00:00.000Z",
            "credits": 100,
            "mcqHistory": [
                {
                    "id": "old-test-1",
                    "chapterId": "ch-1",
                    "date": "2023-10-01T10:00:00.000Z",
                    "score": 5,
                    "totalQuestions": 10,
                    "correctCount": 5,
                    "wrongCount": 5,
                    "totalTimeSeconds": 300
                },
                {
                    "id": "old-test-2",
                    "chapterId": "ch-1",
                    "date": "2023-10-02T11:30:00.000Z",
                    "score": 6,
                    "totalQuestions": 10,
                    "correctCount": 6,
                    "wrongCount": 4,
                    "totalTimeSeconds": 250
                },
                {
                    "id": "old-test-3",
                    "chapterId": "ch-1",
                    "date": "2023-10-03T09:15:00.000Z",
                    "score": 4,
                    "totalQuestions": 10,
                    "correctCount": 4,
                    "wrongCount": 6,
                    "totalTimeSeconds": 400
                }
            ]
        }

        # Inject into localStorage before load
        page.goto("http://localhost:5000") # Assuming Vite default
        page.evaluate(f"""() => {{
            localStorage.setItem('nst_current_user', JSON.stringify({json.dumps(user)}));
            localStorage.setItem('nst_terms_accepted', 'true');
            localStorage.setItem('nst_has_seen_welcome', 'true');
            localStorage.setItem('nst_last_daily_tracker_date', new Date().toDateString());
            localStorage.setItem('nst_last_daily_challenge_date', new Date().toDateString());
        }}""")

        # Reload to apply
        page.reload()
        time.sleep(5) # Wait for app to load

        # 2. Verify Marksheet Card (Analysis)
        # Click OMR tab to see Topic Breakdown / Why Weak
        try:
            page.get_by_text("OMR").click()
            time.sleep(1)
            page.screenshot(path="verification/marksheet_omr_weak.png")
            print("Marksheet OMR screenshot taken.")
        except Exception as e:
            print(f"Error clicking OMR: {e}")

        # 3. Close Marksheet
        page.keyboard.press("Escape")
        time.sleep(1)
        try:
            page.locator("button:has-text('Close'), button .lucide-x").first.click()
            time.sleep(2)
        except:
            pass

        # 4. Verify Revision Hub
        try:
            page.get_by_text("Revision").click()
            time.sleep(2)
            page.screenshot(path="verification/revision_hub.png")
            print("Revision Hub screenshot taken.")
        except Exception as e:
            print(f"Error navigating to Revision Hub: {e}")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
