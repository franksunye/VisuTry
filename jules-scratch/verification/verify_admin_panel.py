from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the signin page
    page.goto("http://localhost:3000/auth/signin")

    # Fill in the email and select 'admin'
    page.get_by_placeholder("test@example.com").fill("admin@example.com")
    page.get_by_label("User Type").select_option("admin")
    page.get_by_role("button", name="Sign In").click()

    # Wait for navigation to the dashboard
    page.wait_for_url("http://localhost:3000/dashboard")

    # Go to the admin dashboard
    page.goto("http://localhost:3000/admin/dashboard")

    # Check for the Admin Panel heading
    expect(page.get_by_role("heading", name="Admin Panel")).to_be_visible()

    # Check for the dashboard title
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
