from playwright.sync_api import sync_playwright
import time

def verify_login_screen():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(msg.text))

        try:
            print("Navigating to http://localhost:5000...")
            page.goto("http://localhost:5000")

            # Wait for key elements
            print("Waiting for login screen content...")
            # Try to find the app name or login header
            page.wait_for_selector("text=IDEAL INSPIRATION CLASSES", timeout=10000)
            print("Found app title.")

            page.wait_for_selector("text=Student Login", timeout=5000)
            print("Found 'Student Login' text.")

            print("✅ Verification Successful: Login screen is visible.")

        except Exception as e:
            print(f"❌ Verification Failed: {e}")
            print("Console Logs:")
            for log in console_logs:
                print(f" - {log}")
            page.screenshot(path="verification_failure.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_login_screen()
