import { test, expect } from "@playwright/test";
import { CheckoutCart } from "../src/page-objects/storefront/CheckoutCart";
import { CheckoutConfirm } from "../src/page-objects/storefront/CheckoutConfirm";
import { CheckoutFinish } from "../src/page-objects/storefront/CheckoutFinish";
import { AccountOrderEdit } from "../src/page-objects/storefront/AccountOrderEdit";
import { AccountLogin } from "../src/page-objects/storefront/AccountLogin";
import { BUNDLED_RESOURCES } from "../src/locales";
import { LanguageHelper, setCurrentContext } from "../src/services/LanguageHelper";
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

test("Chinese login targets the exact login action", async ({ page }) => {
    await page.setContent("<button>登录或注册</button><button>登录</button>");
    const context = {};
    LanguageHelper.setForContext(context, await LanguageHelper.createInstance("zh-CN"));
    setCurrentContext(context);
    const login = new AccountLogin(page);
    setCurrentContext(null);
    await expect(login.loginButton).toHaveCount(1);
});

test("Chinese login uses the platform email label", async ({ page }) => {
    await page.setContent(
        '<form class="login-form"><label>邮箱<input type="email"></label><label>密码<input type="password"></label></form><form class="register-form"><label>邮箱<input type="email"></label><label>密码<input type="password"></label></form>'
    );
    const context = {};
    LanguageHelper.setForContext(context, await LanguageHelper.createInstance("zh-CN"));
    setCurrentContext(context);
    const login = new AccountLogin(page);
    setCurrentContext(null);
    await login.emailInput.fill("customer@example.com", { timeout: 1000 });
    await expect(login.emailInput).toHaveValue("customer@example.com");
    await login.passwordInput.fill("shopwell", { timeout: 1000 });
    await expect(login.passwordInput).toHaveValue("shopwell");
});

test("The promotion discounts tab uses its actual add action", async () => {
    const helper = await LanguageHelper.createInstance("zh-CN");
    expect(helper.translate("administration:promotion:actions.addDiscount")).toBe("添加折扣");
});

for (const CheckoutPage of [CheckoutCart, CheckoutConfirm, CheckoutFinish, AccountOrderEdit]) {
    test(`${CheckoutPage.name} distinguishes the grand total from the net total`, async ({ page }) => {
        await page.setContent(
            '<dl><dt class="checkout-aside-summary-total">总额</dt><dd class="checkout-aside-summary-total">¥12.00</dd><dt class="summary-net">净总额</dt><dd class="summary-net">¥10.00</dd></dl>'
        );
        const checkout = new CheckoutPage(page);
        await expect(checkout.grandTotalPrice).toHaveCount(1);
        await expect(checkout.grandTotalPrice).toHaveText("¥12.00");
    });
}

test("Checkout terms locate the real consent checkbox when legal text contains an inline button", async ({ page }) => {
    await page.setContent('<label for="tos">我已阅读并同意 <button>服务条款</button>。</label><input type="checkbox" id="tos">');
    const checkout = new CheckoutConfirm(page);
    await checkout.termsAndConditionsCheckbox.check({ timeout: 1000 });
    await expect(checkout.termsAndConditionsCheckbox).toBeChecked();
});

test("Checkout finish identifies the completed order independently of the shop name and language", async ({ page }) => {
    await page.setContent('<h1 class="finish-header">感谢您在 示例商城 下单！</h1><p class="finish-ordernumber" data-order-number="10007">您的订单号：10007</p>');
    const finish = new CheckoutFinish(page);
    await expect(finish.headline).toBeVisible();
});

test("Checkout finish reads the order number from its public data attribute", async ({ page }) => {
    await page.setContent('<p class="finish-ordernumber" data-order-number="10007">您的订单号：10007</p>');
    const finish = new CheckoutFinish(page);
    await expect(finish.orderNumberText).toHaveText("您的订单号：10007");
    expect(await finish.getOrderNumber()).toBe("10007");
});
