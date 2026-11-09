import type { Page, Locator } from "playwright-core";
import type { PageObject } from "../../types/PageObject";

export class Search implements PageObject {
    public readonly headline: Locator;
    public readonly productImages: Locator;
    public readonly productListItems: Locator;
    public readonly productItemNames: Locator;

    public readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.headline = page.locator("h1.search-headline");
        this.productImages = page.locator(".product-image-wrapper");
        this.productListItems = page.locator(".search-page .product-listing-row .product-box");
        this.productItemNames = this.productListItems.locator(".product-name");
    }

    async getTotalSearchResultCount(): Promise<number> {
        const liveText = await this.page.locator(".search-page .product-listing-row").getAttribute("data-aria-live-text");
        const counts = liveText?.match(/\d+/g);
        if (!counts?.length) {
            throw new Error("Search result count is missing from the listing live text.");
        }
        return Number(counts[counts.length - 1]);
    }

    url(searchTerm: string) {
        return `search?search=${searchTerm}`;
    }
}
