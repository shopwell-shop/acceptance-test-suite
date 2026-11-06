import { test, expect } from "@playwright/test";
import { DocumentListing } from "../../src/page-objects/administration/DocumentListing";
import { LanguageHelper, setCurrentContext } from "../../src/services/LanguageHelper";

for (const typeLabel of ["Invoice", "发票"]) {
    for (const configName of ["invoice", "自定义开票配置"]) {
        test(`Chinese document listing opens ${configName} with the exact ${typeLabel} type`, async ({ page }) => {
            const originalLocale = process.env.LANG;
            process.env.LANG = "zh-CN";
            const context = {};
            LanguageHelper.setForContext(context, await LanguageHelper.createInstance("zh-CN"));
            setCurrentContext(context);
            try {
                await page.setContent(`
                    <div class="sw-grid-row">
                        <div class="sw-document-list__column-name"><a href="#/sw/settings/document/detail/cancellation">发票</a></div>
                        <div class="sw-document-list__column-type">Cancellation invoice</div>
                    </div>
                    <div class="sw-grid-row">
                        <div class="sw-document-list__column-name"><a href="#/sw/settings/document/detail/credit">贷记配置</a></div>
                        <div class="sw-document-list__column-type">红字发票</div>
                    </div>
                    <div class="sw-grid-row">
                        <div class="sw-document-list__column-name"><a href="#/sw/settings/document/detail/invoice">${configName}</a></div>
                        <div class="sw-document-list__column-type">${typeLabel}</div>
                    </div>
                `);
                const listing = new DocumentListing(page);
                await expect(listing.invoiceLink).toHaveCount(1);
                await expect(listing.invoiceLink).toHaveAttribute("href", "#/sw/settings/document/detail/invoice", { timeout: 1000 });
                await listing.invoiceLink.click();
                await expect(page).toHaveURL(/#\/sw\/settings\/document\/detail\/invoice$/);
            } finally {
                setCurrentContext(null);
                if (originalLocale === undefined) delete process.env.LANG;
                else process.env.LANG = originalLocale;
            }
        });
    }
}

test("English document listing preserves the configuration-name locator", async ({ page }) => {
    const originalLocale = process.env.LANG;
    process.env.LANG = "en-GB";
    const context = {};
    LanguageHelper.setForContext(context, await LanguageHelper.createInstance("en-GB"));
    setCurrentContext(context);
    try {
        await page.setContent('<a href="#/sw/settings/document/detail/invoice">invoice</a><a href="#/sw/settings/document/detail/other">other configuration</a>');
        const listing = new DocumentListing(page);
        await expect(listing.invoiceLink).toHaveAttribute("href", "#/sw/settings/document/detail/invoice", { timeout: 1000 });
    } finally {
        setCurrentContext(null);
        if (originalLocale === undefined) delete process.env.LANG;
        else process.env.LANG = originalLocale;
    }
});
