// @vitest-environment happy-dom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vite-plus/test";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { RichTextEditor } from "./rich-text-editor-field";

const mocks = vi.hoisted(() => ({ mobile: false }));
vi.mock("@reactive-resume/ui/hooks/use-breakpoint", () => ({
	useBreakpoint: () => (mocks.mobile ? "mobile" : "desktop"),
}));
vi.mock("@reactive-resume/ui/hooks/use-keyboard-inset", () => ({ useKeyboardInset: () => 0 }));
vi.mock("@/features/settings/integrations/hooks/use-has-usable-ai-provider", () => ({
	useHasUsableAiProvider: () => ({ hasUsableProvider: false }),
}));
vi.mock("@/hooks/use-confirm", () => ({ usePrompt: () => vi.fn() }));
vi.mock("./improve", () => ({ lineAtCaret: () => null, ImprovePanel: () => null }));

it.each([false, true])(
	"retains formatting controls while keyboard focus enters the toolbar (mobile=%s)",
	async (mobile) => {
		mocks.mobile = mobile;
		i18n.load("en", {});
		i18n.activate("en");
		render(
			<I18nProvider i18n={i18n}>
				<RichTextEditor label="Summary" value="<p>Example</p>" onChange={vi.fn()} />
				<button type="button">Outside</button>
			</I18nProvider>,
		);
		const editor = await screen.findByRole("textbox", { name: "Summary" });
		await act(async () => {
			editor.focus();
		});
		const bold = screen.getByRole("button", { name: "Bold" });
		if (mobile)
			await act(async () => {
				bold.focus();
			});
		else await userEvent.tab();
		expect(document.activeElement).toBe(bold);
		expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeDefined();
		await userEvent.keyboard("{Enter}");
		expect(screen.getByRole("button", { name: "Bold" }).getAttribute("aria-pressed")).toBe("true");
		await act(async () => {
			screen.getByRole("button", { name: "Outside" }).focus();
		});
		expect(screen.queryByRole("toolbar")).toBeNull();
	},
);

it("shows rich content read-only and never rewrites it", async () => {
	mocks.mobile = false;
	i18n.load("en", {});
	i18n.activate("en");
	const onChange = vi.fn();
	const value =
		'<div style="display: flex; flex-direction: row; gap: 6pt"><div style="background-color: #ccfbf1; padding: 3pt 8pt">+38% sales</div></div><svg width="140" height="6" viewBox="0 0 140 6"><rect width="126" height="6" fill="#0d9488"/></svg>';
	render(
		<I18nProvider i18n={i18n}>
			<RichTextEditor label="Summary" value={value} onChange={onChange} />
		</I18nProvider>,
	);
	const editor = await screen.findByRole("textbox", { name: "Summary" });
	expect(editor.getAttribute("contenteditable")).toBe("false");
	expect(screen.getByRole("status").textContent).toContain("read-only");
	await act(async () => {
		editor.focus();
	});
	await userEvent.keyboard("typing");
	expect(onChange).not.toHaveBeenCalled();
});
