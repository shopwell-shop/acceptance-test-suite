import { test, expect } from "@playwright/test";
import { BUNDLED_RESOURCES } from "../src/locales";
import { LanguageHelper } from "../src/services/LanguageHelper";
import { getCountryAddressData, getLocale, getCountryCodeFromLocale, getCurrencyCodeFromLocale } from "../src/services/ShopwellDataHelpers";

test("Chinese resources cover every English translation key and keep interpolation parameters", async () => {
    const flatten = (value: unknown, prefix = ""): Record<string, string> => {
        if (typeof value === "string") return { [prefix]: value };
        return Object.assign({}, ...Object.entries(value as Record<string, unknown>).map(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key)));
    };
    const english = flatten(BUNDLED_RESOURCES.en);
    const chinese = flatten(BUNDLED_RESOURCES.zh);
    for (const [key, source] of Object.entries(english)) {
        expect(chinese, key).toHaveProperty([key]);
        expect(chinese[key], key).toBeTruthy();
        expect((chinese[key].match(/\{\{?\w+\}?\}/g) ?? []).sort(), key).toEqual((source.match(/\{\{?\w+\}?\}/g) ?? []).sort());
    }
    const helper = await LanguageHelper.createInstance("zh-CN");
    expect(helper.translate("storefront:home:cookie.wishlist.accept")).toBe("接受 Cookie");
    expect(helper.translate("storefront:account:general.customerGroupAccessRequested", { customerGroup: "企业客户" })).toContain("企业客户");
});

test("Unsupported machine locales use the Chinese platform defaults", () => {
    const original = process.env.LANG;
    process.env.LANG = "C.UTF-8";
    try {
        expect(getLocale()).toBe("zh-CN");
        expect(getCountryCodeFromLocale()).toBe("CN");
        expect(getCurrencyCodeFromLocale()).toBe("CNY");
        expect(getCountryAddressData().country).toBe("中国");
    } finally {
        if (original === undefined) delete process.env.LANG;
        else process.env.LANG = original;
    }
});
