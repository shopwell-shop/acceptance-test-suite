import type { Page, Locator } from "playwright-core";
import type { PageObject } from "../../types/PageObject";
import { translate } from "../../services/LanguageHelper";
import { getLanguageCode } from "../../services/ShopwellDataHelpers";

export class CheckoutFinish implements PageObject {
    public readonly headline: Locator;
    public readonly orderNumberText: Locator;
    public readonly grandTotalPrice: Locator;
    public readonly taxPrice: Locator;
    public readonly cartLineItemImages: Locator;
    public readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        this.headline = page.locator("h1.finish-header");
        this.orderNumberText = page.locator(".finish-ordernumber[data-order-number]");
        this.grandTotalPrice = page.locator("dd.checkout-aside-summary-total:visible");
        this.taxPrice =
            getLanguageCode() === "zh-CN"
                ? page.locator("dd.summary-tax")
                : page.locator(`dt:text-matches("${translate("storefront:checkout:common.plusVat")} [0-9]\\+\\?${translate("storefront:checkout:common.vatSuffix")}") + dd`);
        this.cartLineItemImages = page.locator(".line-item-img-link");
    }

    url() {
        return "checkout/finish";
    }

    async getOrderNumber(): Promise<string | null> {
        return this.orderNumberText.getAttribute("data-order-number");
    }

    getOrderId(): string {
        const url = this.page.url();
        const [, searchString] = url.split("?");
        const params = new URLSearchParams(searchString);

        return params.get("orderId") ?? "";
    }
}
