import type { Page, Locator } from "playwright-core";
import type { PageObject } from "../../types/PageObject";
import type { ContentRootSource } from "../../types/ShopwellTypes";
import { translate } from "../../services/LanguageHelper";

export class ExperienceStudio implements PageObject {
    public readonly page: Page;
    public readonly createNewLayoutButton: Locator;
    public readonly searchLayoutInput: Locator;
    public readonly layoutNameInput: Locator;
    public readonly createLayoutButton: Locator;
    public readonly cancelCreateButton: Locator;
    public readonly layoutTitle: Locator;
    public readonly saveButton: Locator;
    public readonly assignmentsButton: Locator;
    public readonly assignmentModal: Locator;
    public readonly assignmentEntitiesInput: Locator;
    public readonly assignmentSaveButton: Locator;
    public readonly layoutStructure: Locator;

    constructor(page: Page) {
        this.page = page;
        this.createNewLayoutButton = page.getByRole("button", { name: translate("administration:experienceStudio:createNewLayout"), exact: true });
        this.searchLayoutInput = page.locator(".sw-experience-studio-list .sw-search-bar__input");
        const wizard = page.locator(".sw-experience-studio-create-wizard");
        this.layoutNameInput = wizard.getByLabel(translate("administration:experienceStudio:layoutName"), { exact: true });
        this.createLayoutButton = wizard.getByRole("button", { name: translate("administration:experienceStudio:startEditing"), exact: true });
        this.cancelCreateButton = wizard.getByRole("button", { name: translate("administration:experienceStudio:cancel"), exact: true });
        this.layoutTitle = page.locator(".sw-experience-studio-toolbar__page-name");
        this.saveButton = page.locator(".sw-experience-studio-toolbar").getByRole("button", { name: translate("administration:experienceStudio:saveLayout"), exact: true });
        this.assignmentsButton = page.locator(".sw-experience-studio-toolbar").getByRole("button", { name: translate("administration:experienceStudio:assignments"), exact: true });
        this.assignmentModal = page.getByRole("dialog", { name: translate("administration:experienceStudio:assignmentTitle"), exact: true });
        this.assignmentEntitiesInput = this.assignmentModal.locator(".sw-experience-studio-assignment-modal__entities input");
        this.assignmentSaveButton = this.assignmentModal.getByRole("button", { name: translate("administration:experienceStudio:save"), exact: true });
        this.layoutStructure = page.locator(".sw-experience-studio-detail__sidebar-tree");
    }

    layoutLink(name: string): Locator {
        return this.page.locator(".sw-experience-studio-list").getByRole("link", { name, exact: true });
    }

    layoutTypeOption(rootSource: Exclude<ContentRootSource, "none">): Locator {
        return this.page
            .locator(".sw-experience-studio-create-wizard")
            .getByRole("radio", { name: translate(`administration:experienceStudio:layoutTypes.${rootSource}`), exact: true });
    }

    assignmentOption(name: string): Locator {
        return this.page.locator(".sw-select-result-list__content").getByText(name, { exact: true });
    }

    url(layoutId?: string): string {
        return layoutId ? `#/sw/experience/studio/detail/${layoutId}` : "#/sw/experience/studio/index";
    }

    createUrl(): string {
        return "#/sw/experience/studio/create";
    }
}
