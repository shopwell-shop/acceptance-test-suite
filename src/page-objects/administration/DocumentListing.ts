import type { Page, Locator } from "playwright-core";
import type { PageObject } from "../../types/PageObject";
import { translate } from "../../services/LanguageHelper";
import { getLanguageCode } from "../../services/ShopwellDataHelpers";
import enDocument from "../../locales/en/administration/document.json" with { type: "json" };
import zhDocument from "../../locales/zh/administration/document.json" with { type: "json" };

export class DocumentListing implements PageObject {
    public readonly addDocumentButton: Locator;
    public readonly invoiceLink: Locator;
    public readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.addDocumentButton = page.getByRole("button", { name: translate("administration:document:listing.addDocument") });
        if (getLanguageCode() === "zh-CN") {
            const typeNames = [enDocument.types.invoice, zhDocument.types.invoice].map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
            const invoiceType = page.locator(".sw-document-list__column-type").filter({ hasText: new RegExp(`^\\s*(?:${typeNames.join("|")})\\s*$`, "i") });
            this.invoiceLink = page.locator(".sw-grid-row").filter({ has: invoiceType }).locator(".sw-document-list__column-name").getByRole("link");
        } else {
            this.invoiceLink = page.getByRole("link", { name: translate("administration:document:types.invoice"), exact: true });
        }
    }

    url() {
        return `#/sw/settings/document/index`;
    }
}
