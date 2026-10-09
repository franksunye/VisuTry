import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MerchantWorkspaceSettings } from "@/components/merchant/MerchantWorkspaceSettings";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function renderSettings(overrides: { name?: string; websiteUrl?: string | null } = {}) {
  return render(
    <MerchantWorkspaceSettings
      merchantId="merchant-a"
      brandOwner={true}
      initialName={overrides.name ?? "Local workspace"}
      initialWebsiteUrl={overrides.websiteUrl ?? null}
    />,
  );
}

describe("MerchantWorkspaceSettings", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    global.fetch = jest.fn();
  });

  it("renders a page heading and an always-open, labelled details form", () => {
    renderSettings({ name: "Northstar Optics", websiteUrl: "https://northstar.example" });

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Workspace details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Where these details appear" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Workspace details" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Workspace details/ })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Brand or store name" })).toHaveValue("Northstar Optics");
    expect(screen.getByRole("textbox", { name: /Website/ })).toHaveValue("https://northstar.example");
    expect(screen.getByRole("textbox", { name: /Website/ })).toHaveAttribute("type", "url");
    expect(screen.getByText(/public Store and Campaign experiences/)).toBeInTheDocument();
    expect(screen.queryByText(/Analytics & reports|Recommendations|Integrations/)).not.toBeInTheDocument();
  });

  it("does not expose public identity writes to an ADMIN", () => {
    render(<MerchantWorkspaceSettings merchantId="merchant-a" initialName="Example Optics" brandOwner={false} liveExperiences={2} />);
    expect(screen.getByRole("textbox", { name: "Brand or store name" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: /Website/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save details" })).toBeDisabled();
    expect(screen.getByText("Only the Merchant Owner can edit public workspace identity.")).toBeInTheDocument();
  });

  it("renders an empty optional website as an empty URL field", () => {
    renderSettings({ name: "Local workspace", websiteUrl: null });

    expect(screen.getByRole("textbox", { name: /Website/ })).toHaveValue("");
  });

  it("keeps Save disabled for a trimmed name shorter than two characters", async () => {
    const user = userEvent.setup();
    renderSettings({ name: "Local workspace" });
    const name = screen.getByRole("textbox", { name: "Brand or store name" });
    const save = screen.getByRole("button", { name: "Save details" });

    await user.clear(name);
    await user.type(name, " A ");
    expect(save).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();

    await user.clear(name);
    await user.type(name, "Revised workspace");
    expect(save).toBeEnabled();
  });

  it("PATCHes the existing endpoint, sends an empty website as null, and refreshes on success", async () => {
    const user = userEvent.setup();
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    renderSettings({ name: "Original workspace", websiteUrl: null });

    await user.clear(screen.getByRole("textbox", { name: "Brand or store name" }));
    await user.type(screen.getByRole("textbox", { name: "Brand or store name" }), "  Revised workspace  ");
    await user.click(screen.getByRole("button", { name: "Save details" }));

    await screen.findByRole("status");
    expect(fetchMock).toHaveBeenCalledWith("/api/merchant/merchant-a/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "  Revised workspace  ", websiteUrl: null }),
    });
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("sends a populated website URL unchanged", async () => {
    const user = userEvent.setup();
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    renderSettings({ name: "Local workspace", websiteUrl: "https://old.example" });

    await user.clear(screen.getByRole("textbox", { name: /Website/ }));
    await user.type(screen.getByRole("textbox", { name: /Website/ }), "https://new.example/path");
    await user.click(screen.getByRole("button", { name: "Save details" }));

    await screen.findByRole("status");
    expect(fetchMock).toHaveBeenCalledWith("/api/merchant/merchant-a/profile", expect.objectContaining({
      body: JSON.stringify({ name: "Local workspace", websiteUrl: "https://new.example/path" }),
    }));
  });

  it("announces API errors accessibly and retains entered values", async () => {
    const user = userEvent.setup();
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ success: false, error: "INVALID_WEBSITE_URL" }) });
    renderSettings({ name: "Local workspace", websiteUrl: "https://existing.example" });
    const website = screen.getByRole("textbox", { name: /Website/ });
    await user.clear(website);
    await user.type(website, "not a URL");
    await user.click(screen.getByRole("button", { name: "Save details" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Enter a valid website URL starting with http:// or https://.");
    expect(website).toHaveValue("not a URL");
    expect(website).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Save details" })).toBeEnabled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("clears the saving state after a network error", async () => {
    const user = userEvent.setup();
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValue(new Error("Local request failed"));
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Save details" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Local request failed");
    await waitFor(() => expect(screen.getByRole("button", { name: "Save details" })).toBeEnabled());
    expect(screen.getByRole("textbox", { name: "Brand or store name" })).toHaveValue("Local workspace");
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
