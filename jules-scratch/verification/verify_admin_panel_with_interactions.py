from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Login as Admin
    page.goto("http://localhost:3000/auth/signin")
    page.get_by_placeholder("test@example.com").fill("admin@example.com")
    page.get_by_label("User Type").select_option("admin")
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_url("http://localhost:3000/dashboard")

    # 2. Navigate to User Management
    page.goto("http://localhost:3000/admin/users")

    # Wait for the initial user list to be visible
    expect(page.get_by_text("Test User")).to_be_visible()
    expect(page.get_by_text("Premium User")).to_be_visible()

    # 3. Test the search functionality
    search_input = page.get_by_placeholder("Search by name or email...")
    search_input.fill("Premium")

    # After searching for "Premium", expect "Test User" to be gone
    expect(page.get_by_text("Test User")).not_to_be_visible()
    expect(page.get_by_text("Premium User")).to_be_visible()

    # Clear the search to reset the list
    search_input.fill("")
    expect(page.get_by_text("Test User")).to_be_visible()

    # 4. Test the pagination (assuming there are enough users to paginate)
    # This part of the test might not show a change if there's only one page.
    # We will click it anyway to ensure no errors occur.
    next_button = page.get_by_role("button", name="Next")
    if next_button.is_enabled():
        next_button.click()
        # After clicking next, we expect the page number to change in the URL
        expect(page).to_have_url(lambda url: "page=2" in url)

    # 5. Take a final screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
