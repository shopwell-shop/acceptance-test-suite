import type { Page, Locator } from "playwright-core";
import type { PageObject } from "../../types/PageObject";
import { translate } from "../../services/LanguageHelper";

export class LandingPageCreate implements PageObject {
    /**
     * General
     */
    public readonly nameInput: Locator;
    public readonly landingPageStatus: Locator;
    public readonly salesChannelSelectionList: Locator;
    public readonly filtersResultPopoverItemList: Locator;
    public readonly saveLandingPageButton: Locator;
    public readonly loadingSpinner: Locator;
    public readonly seoUrlInput: Locator;

    public readonly layoutTab: Locator;
    public readonly experienceStudioButton: Locator;
    public readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        //Common
        this.loadingSpinner = page.locator(".sw-loader");
        this.saveLandingPageButton = page.getByRole("button", { name: translate("administration:landingPage:general.save") });
        //General
        this.nameInput = page.getByLabel(translate("administration:landingPage:general.name"));
        this.landingPageStatus = page.getByRole("checkbox", { name: translate("administration:landingPage:general.active") });
        this.salesChannelSelectionList = page
            .locator(".sw-select")
            .filter({ hasText: translate("administration:landingPage:general.salesChannels") })
            .locator(".sw-select-selection-list");
        this.filtersResultPopoverItemList = page.locator(".sw-select-result-list__content").getByRole("listitem");
        this.seoUrlInput = page.getByLabel(translate("administration:landingPage:general.seoUrl"));
        this.layoutTab = page.getByRole("tab", { name: translate("administration:landingPage:layout.layout") });
        this.experienceStudioButton = page.getByRole("button", { name: translate("administration:experienceStudio:title"), exact: true });
    }

    url() {
        return `#/sw/category/landingPage/create/base`;
    }
}
