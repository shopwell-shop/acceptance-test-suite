import { test, expect } from "@playwright/test";
import { CheckoutCart } from "../src/page-objects/storefront/CheckoutCart";
import { CheckoutConfirm } from "../src/page-objects/storefront/CheckoutConfirm";
import { CheckoutFinish } from "../src/page-objects/storefront/CheckoutFinish";
import { AccountOrderEdit } from "../src/page-objects/storefront/AccountOrderEdit";
import { AccountOrder } from "../src/page-objects/storefront/AccountOrder";
import { AccountLogin } from "../src/page-objects/storefront/AccountLogin";
import { AccountProfile } from "../src/page-objects/storefront/AccountProfile";
import { AccountRecover } from "../src/page-objects/storefront/AccountRecover";
import { Dashboard } from "../src/page-objects/administration/Dashboard";
import { CustomFieldCreate } from "../src/page-objects/administration/CustomFieldCreate";
import { CustomFieldDetail } from "../src/page-objects/administration/CustomFieldDetail";
import { CustomerListing } from "../src/page-objects/administration/CustomerListing";
import { CustomerBulkEdit } from "../src/page-objects/administration/CustomerBulkEdit";
import { CustomerDetail } from "../src/page-objects/administration/CustomerDetail";
import { ContactForm } from "../src/page-objects/storefront/ContactForm";
import { ProductDetail } from "../src/page-objects/storefront/ProductDetail";
import { OffCanvasCart } from "../src/page-objects/storefront/OffCanvasCart";
import { Home } from "../src/page-objects/storefront/Home";
import { Account } from "../src/page-objects/storefront/Account";
import { PageNotFound } from "../src/page-objects/storefront/PageNotFound";
import { LandingPageCreate } from "../src/page-objects/administration/LandingPageCreate";
import { DataSharingConsentModal } from "../src/page-objects/administration/DataSharingConsentModal";
import { FirstRunWizard } from "../src/page-objects/administration/FirstRunWizard";
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

test("Chinese profile locates the platform invalid-email feedback", async ({ page }) => {
    await page.setContent('<div class="invalid-feedback">邮箱格式不正确，应为 "user@example.com"</div>');
    const context = {};
    LanguageHelper.setForContext(context, await LanguageHelper.createInstance("zh-CN"));
    setCurrentContext(context);
    const profile = new AccountProfile(page, {
        version: "6.7.16.0",
        isSaaS: false,
        isPaaS: false,
        features: { ACCESSIBILITY_TWEAKS: true },
    });
    setCurrentContext(null);
    await expect(profile.emailValidationAlert).toBeVisible({ timeout: 1000 });
});

test("Chinese recovery locates the confirmation without disclosing email registration", async ({ page }) => {
    await page.setContent('<div role="alert">如该邮箱已注册，我们已发送重置邮件。</div>');
    const context = {};
    LanguageHelper.setForContext(context, await LanguageHelper.createInstance("zh-CN"));
    setCurrentContext(context);
    const recover = new AccountRecover(page);
    setCurrentContext(null);
    await expect(recover.passwordResetEmailSentMessage).toBeVisible({ timeout: 1000 });
});

test("Chinese customer bulk-edit heading selects the requested customer count", async ({ page }) => {
    await page.setContent('<div class="sw-customer-bulk-edit-modal"><div role="dialog"><h1>批量修改 - 已选 2 个元素</h1><h1>批量修改 - 已选 3 个元素</h1></div></div>');
    const context = {};
    LanguageHelper.setForContext(context, await LanguageHelper.createInstance("zh-CN"));
    setCurrentContext(context);
    const customers = new CustomerListing(page);
    const heading = await customers.getCustomerBulkEditModalTitle(3);
    setCurrentContext(null);
    await expect(heading).toHaveText("批量修改 - 已选 3 个元素", { timeout: 1000 });
});

for (const CheckoutPage of [CheckoutConfirm, CheckoutFinish]) {
    test(`${CheckoutPage.name} locates every Chinese tax value without including totals`, async ({ page }) => {
        await page.setContent(
            '<dl><dt class="summary-tax">含 19 %% 税</dt><dd class="summary-tax">¥3.19</dd><dt class="summary-tax">含 7 %% 税</dt><dd class="summary-tax">¥1.31</dd><dt>总额</dt><dd class="checkout-aside-summary-total">¥24.50</dd></dl>'
        );
        const originalLocale = process.env.LANG;
        process.env.LANG = "zh-CN";
        try {
            const checkout = new CheckoutPage(page);
            await expect(checkout.taxPrice).toHaveText(["¥3.19", "¥1.31"], { timeout: 1000 });
        } finally {
            if (originalLocale === undefined) delete process.env.LANG;
            else process.env.LANG = originalLocale;
        }
    });
}

test.describe("Chinese public contracts match rendered platform markup", () => {
    const instanceMeta = { version: "6.7.16.0", isSaaS: false, isPaaS: false, features: {} };
    let originalLocale: string | undefined;
    test.beforeEach(async () => {
        originalLocale = process.env.LANG;
        process.env.LANG = "zh-CN";
        const context = {};
        LanguageHelper.setForContext(context, await LanguageHelper.createInstance("zh-CN"));
        setCurrentContext(context);
    });
    test.afterEach(() => {
        setCurrentContext(null);
        if (originalLocale === undefined) delete process.env.LANG;
        else process.env.LANG = originalLocale;
    });

    for (const CartPage of [ProductDetail, OffCanvasCart]) {
        test(`${CartPage.name} selects subtotal values without shipping or hidden summaries`, async ({ page }) => {
            await page.setContent(
                '<div class="offcanvas-summary"><dl><dt class="summary-total">小计</dt><dd class="summary-total">¥24.50</dd><dt>运费</dt><dd>¥5.00</dd></dl></div><div hidden><dl><dt class="summary-total">小计</dt><dd class="summary-total">¥99.00</dd></dl></div>'
            );
            const cart = new CartPage(page);
            await expect(cart instanceof ProductDetail ? cart.offCanvasSummaryTotalPrice : cart.subTotalPrice).toHaveText("¥24.50", { timeout: 1000 });
        });
    }

    test("filter names interpolate into the complete accessible name", async ({ page }) => {
        const helper = await LanguageHelper.createInstance("zh-CN");
        await page.setContent(
            `<div aria-label="${helper.translate("storefront:home:filters.filterPanel")}"><ul><li><button aria-label="按 颜色 筛选">颜色</button></li><li><button aria-label="按 大小 筛选">大小</button></li></ul></div>`
        );
        const filter = await new Home(page, instanceMeta).getFilterButtonByFilterName("颜色");
        await expect(filter).toHaveAccessibleName("按 颜色 筛选", { timeout: 1000 });
    });

    test("stock warning retains product name and the one-unit availability contract", async ({ page }) => {
        await page.setContent('<div role="alert">商品“中文商品”仅剩 1 件</div><div role="alert">商品“另一个商品”仅剩 2 件</div>');
        const cart = new CheckoutCart(page);
        await expect(cart.stockReachedAlert).toHaveText("商品“中文商品”仅剩 1 件", { timeout: 1000 });
        await expect(cart.stockReachedAlert).toContainText("中文商品");
    });

    for (const field of ["shareStoreDataText", "shareUsageDataText"] as const) {
        test(`${field} consent description includes emphasis and inline links`, async ({ page }) => {
            await page.setContent(
                '<div role="dialog"><h1>帮助我们改进 Shopwell</h1><p>来自你 Shopwell 环境的匿名数据（如 <strong>订单</strong>、<strong>诊断数据</strong> 和 <strong>店铺数据</strong>）可帮助我们改进功能。所有数据概览和协议详情请见<a href="#details">此处</a>。</p><p>我们使用你在后台操作中的个人<strong>使用数据</strong>来持续改进易用性。详情请见我们的<a href="#privacy">隐私政策</a>。</p></div>'
            );
            const consent = new DataSharingConsentModal(page);
            await expect(consent[field]).toBeVisible({ timeout: 1000 });
            await expect(consent.storeDataCollectionDetailsLink).toBeVisible();
            await expect(consent.privacyPolicyLink).toBeVisible();
        });
    }

    test("customer group notice selects the requested group", async ({ page }) => {
        await page.setContent(
            '<div class="alert-content-container">已提交加入客户组“企业客户”的申请。</div><div class="alert-content-container">已提交加入客户组“零售客户”的申请。</div>'
        );
        await expect(await new Account(page, instanceMeta).getCustomerGroupAlert("企业客户")).toHaveText("已提交加入客户组“企业客户”的申请。", { timeout: 1000 });
    });

    test("assign layout selects the exact action instead of the unassigned preview", async ({ page }) => {
        await page.setContent('<div role="button" tabindex="0">未分配布局</div><button>分配布局</button>');
        await expect(new LandingPageCreate(page).assignLayoutButton).toHaveText("分配布局", { timeout: 1000 });
    });

    test("not-found navigation selects the content link instead of the header logo", async ({ page }) => {
        await page.setContent('<header><a href="/" aria-label="返回首页"><img alt="商城"></a></header><main><a href="/">返回首页</a></main>');
        await expect(new PageNotFound(page).backToShopButton).toHaveText("返回首页", { timeout: 1000 });
    });
    test("order navigation locates the sales-order menu entry", async ({ page }) => {
        await page.setContent(
            '<div class="sw-order"><a href="#/sw/order/index"><span title="销售订单">销售订单</span></a><a href="#/sw/order/create"><span title="新建订单">新建订单</span></a></div>'
        );
        await expect(new Dashboard(page).adminMenuOrderOverview).toHaveText("销售订单", { timeout: 1000 });
    });

    test("custom-field assignment uses the actual combobox label", async ({ page }) => {
        await page.setContent('<input role="combobox" aria-label="用于"><input role="combobox" aria-label="另一个字段">');
        const input = new CustomFieldCreate(page).assignToSelectionList;
        await input.fill("商品", { timeout: 1000 });
        await expect(input).toHaveValue("商品");
    });

    test("first-run defaults select channels through the rendered assignment placeholder", async ({ page }) => {
        await page.setContent('<input placeholder="分配销售渠道 ..."><input placeholder="搜索销售渠道">');
        const selection = new FirstRunWizard(page, instanceMeta).salesChannelSelectionMultiSelect;
        await selection.fill("中文商店", { timeout: 1000 });
        await expect(selection).toHaveValue("中文商店");
        await expect(page.getByPlaceholder("搜索销售渠道")).toHaveValue("");
    });

    test("first-run mailer uses the actual recipient address label", async ({ page }) => {
        await page.setContent('<label>收件人地址<input type="email"></label><label>发件人地址<input type="email"></label>');
        const recipient = new FirstRunWizard(page, instanceMeta).smtpServerDeliveryAddressInput;
        await recipient.fill("recipient@example.com", { timeout: 1000 });
        await expect(recipient).toHaveValue("recipient@example.com");
        await expect(page.getByLabel("发件人地址")).toHaveValue("");
    });

    for (const language of ["zh-CN", "en-US"]) {
        for (const link of ["documentationLink", "roadmapLink"] as const) {
            test(`first-run finish selects the ${language} ${link} destination`, async ({ page }) => {
                process.env.LANG = language;
                await page.setContent(
                    '<a href="https://docs.shopwell.cn/zh">文档</a><a href="https://docs.shopwell.cn/en">Documentation</a><a href="https://www.shopwell.cn/zh/roadmap/">路线图</a><a href="https://www.shopwell.cn/en/roadmap/">Roadmap</a>'
                );
                const wizard = new FirstRunWizard(page, instanceMeta);
                const path = language === "zh-CN" ? "zh" : "en";
                const destination = link === "documentationLink" ? `https://docs.shopwell.cn/${path}` : `https://www.shopwell.cn/${path}/roadmap/`;
                await expect(wizard[link]).toHaveAttribute("href", destination, { timeout: 1000 });
            });
        }
    }

    for (const language of ["zh-CN", "en-US"]) {
        test(`first-run finish clicks the ${language} action beside its page heading`, async ({ page }) => {
            process.env.LANG = language;
            const context = {};
            LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
            setCurrentContext(context);
            const title = language === "zh-CN" ? "完成" : "Done";
            const action = language === "zh-CN" ? "完成" : "Finish";
            await page.setContent(`<h1>${title}</h1><button onclick="this.dataset.clicked='true'">${action}</button><button>Next</button>`);
            const wizard = new FirstRunWizard(page, instanceMeta);
            await wizard.finishButton.click({ timeout: 1000 });
            await expect(page.getByRole("button", { name: action, exact: true })).toHaveAttribute("data-clicked", "true");
            await expect(page.getByRole("heading", { name: title, exact: true })).not.toHaveAttribute("data-clicked", "true");
        });
    }

    test("home contact navigation selects the footer contact-form link", async ({ page }) => {
        await page.setContent(
            '<footer><div class="footer-contact-form"><a href="/contact" title="联系我们">联系我们</a></div><ul><li><a href="/service" title="联系我们">客服页面</a></li></ul></footer>'
        );
        await expect(new Home(page, instanceMeta).contactFormLink).toHaveAttribute("href", "/contact", { timeout: 1000 });
    });
    test("layout selection applies the chosen layout through its modal action", async ({ page }) => {
        await page.setContent('<button>保存</button><div role="dialog" aria-label="选择布局"><button>取消</button><button>应用布局</button></div>');
        await expect(new LandingPageCreate(page).layoutSaveButton).toHaveText("应用布局", { timeout: 1000 });
    });
    test("review login locates its own Chinese email field", async ({ page }) => {
        await page.setContent('<form class="product-detail-review-login"><label>邮箱<input type="email"></label></form><form><label>邮箱<input type="email"></label></form>');
        const product = new ProductDetail(page);
        await product.reviewEmailInput.fill("reviewer@example.com", { timeout: 1000 });
        await expect(product.reviewEmailInput).toHaveValue("reviewer@example.com");
    });

    for (const name of ["满意", "满意 (2)"]) {
        test(`review filter selects the exact rating for ${name}`, async ({ page }) => {
            await page.setContent(
                '<div class="product-detail-review-filter"><input id="review5" type="checkbox"><label for="review5" class="custom-control-label">\n  <small>很满意\n (3)</small>\n </label><span class="product-detail-review-share">60%</span></div><div class="product-detail-review-filter"><input id="review4" type="checkbox"><label for="review4" class="custom-control-label">\n  <small>满意\n (2)</small>\n </label><span class="product-detail-review-share">40%</span></div>'
            );
            const filter = await new ProductDetail(page).getReviewFilterRowOptionsByName(name);
            await filter.reviewFilterOptionCheckbox.check({ timeout: 1000 });
            await expect(filter.reviewFilterOptionText).toHaveText("满意 (2)");
            await expect(filter.reviewFilterOptionPercentage).toHaveText("40%");
            await expect(page.getByRole("checkbox", { name: "很满意 (3)", exact: true })).not.toBeChecked();
        });
    }
    test("review login selects the exact password action beside verification-code login", async ({ page }) => {
        await page.setContent('<div class="product-detail-review-login"><button>登录</button><button>验证码登录</button></div><button>登录</button>');
        await expect(new ProductDetail(page).reviewLoginButton).toHaveText("登录", { timeout: 1000 });
    });
});

for (const language of ["zh-CN", "en-GB"]) {
    test(`${language} customer bulk-edit page locates its actual heading`, async ({ page }) => {
        const count = language === "zh-CN" ? 2 : 1;
        const heading = language === "zh-CN" ? "批量修改：2 位客户" : "Bulk edit: 1 customer";
        await page.setContent(`<h1>${heading}</h1><h1>Bulk edit: 3 customers</h1>`);
        const context = {};
        LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
        setCurrentContext(context);
        try {
            await expect(await new CustomerBulkEdit(page).getPageHeadline(count)).toHaveText(heading, { timeout: 1000 });
        } finally {
            setCurrentContext(null);
        }
    });

    test(`${language} customer detail locates the interpolated group request notice`, async ({ page }) => {
        const group = language === "zh-CN" ? "企业客户" : "Business customers";
        const message = language === "zh-CN" ? `已申请访问客户组 "${group}"。` : `Access to customer group "${group}" requested.`;
        await page.setContent(`<div class="sw-customer-detail__customer-registration-alert"><div class="mt-banner__message">${message}</div></div>`);
        const context = {};
        LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
        setCurrentContext(context);
        try {
            const customer = new CustomerDetail(page, { version: "6.7.16.0", isSaaS: false, isPaaS: false, features: {} });
            await expect(await customer.getCustomerGroupAlert(group)).toHaveText(message, { timeout: 1000 });
        } finally {
            setCurrentContext(null);
        }
    });

    test(`${language} contact form uses its actual email label and submit action`, async ({ page }) => {
        const title = language === "zh-CN" ? "联系我们" : "Contact";
        const email = language === "zh-CN" ? "邮箱" : "Your email address";
        const submit = language === "zh-CN" ? "发送" : "Submit";
        await page.setContent(
            `<div class="card"><h2>${title}</h2><label>${email}<input type="email"></label><button onclick="this.dataset.clicked='true'">${submit}</button></div><label>${email}<input type="email"></label>`
        );
        const context = {};
        LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
        setCurrentContext(context);
        try {
            const contact = new ContactForm(page, { version: "6.7.16.0", isSaaS: false, isPaaS: false, features: {} });
            await contact.emailInput.fill("customer@example.com", { timeout: 1000 });
            await expect(contact.emailInput).toHaveValue("customer@example.com");
            await contact.submitButton.click({ timeout: 1000 });
            await expect(contact.submitButton).toHaveAttribute("data-clicked", "true");
        } finally {
            setCurrentContext(null);
        }
    });
}

for (const language of ["zh-CN", "en-GB"]) {
    test(`${language} custom-field creation uses the rendered English-language label`, async ({ page }) => {
        const label = language === "zh-CN" ? "标签 (英语（英国）)" : "Label (English (GB))";
        await page.setContent(`<label>${label}<input></label>`);
        const context = {};
        LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
        setCurrentContext(context);
        try {
            const field = new CustomFieldCreate(page).labelEnglishGBInput;
            await field.fill("Customer note", { timeout: 1000 });
            await expect(field).toHaveValue("Customer note");
        } finally {
            setCurrentContext(null);
        }
    });

    for (const [property, chinese, english] of [
        ["customFieldLabelEnglishGBInput", "标签 (英语（英国）)", "Label (English (GB))"],
        ["customFieldPlaceholderEnglishGBInput", "占位符 (英语（英国）)", "Placeholder (English (GB))"],
        ["customFieldHelpTextEnglishGBInput", "帮助文本 (英语（英国）)", "Help text (English (GB))"],
    ] as const) {
        test(`${language} custom-field detail fills the rendered ${property}`, async ({ page }) => {
            const title = language === "zh-CN" ? "新建自定义字段" : "New custom field";
            const label = language === "zh-CN" ? chinese : english;
            await page.setContent(`<div role="dialog" aria-label="${title}"><label>${label}<input></label></div><label>${label}<input></label>`);
            const context = {};
            LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
            setCurrentContext(context);
            try {
                const field = new CustomFieldDetail(page, { version: "6.7.16.0", isSaaS: false, isPaaS: false, features: {} })[property];
                await field.fill("Customer note", { timeout: 1000 });
                await expect(field).toHaveValue("Customer note");
            } finally {
                setCurrentContext(null);
            }
        });
    }

    test(`${language} custom-field editing checks the actual cart-availability control`, async ({ page }) => {
        const title = language === "zh-CN" ? "编辑自定义字段" : "Edit custom field";
        const label = language === "zh-CN" ? "在购物车中可用" : "Available in shopping cart";
        await page.setContent(`<div role="dialog" aria-label="${title}"><label>${label}<input type="checkbox"></label></div><label>${label}<input type="checkbox"></label>`);
        const context = {};
        LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
        setCurrentContext(context);
        try {
            const field = new CustomFieldDetail(page, { version: "6.7.16.0", isSaaS: false, isPaaS: false, features: {} }).customFieldEditAvailableInShoppingCartCheckbox;
            await field.check({ timeout: 1000 });
            await expect(field).toBeChecked();
        } finally {
            setCurrentContext(null);
        }
    });
}

for (const language of ["zh-CN", "en-GB"]) {
    test(`${language} home resets filters by the actual accessible action name`, async ({ page }) => {
        const visible = language === "zh-CN" ? "全部重置" : "Reset all";
        const accessible = language === "zh-CN" ? "重置全部筛选" : "Reset all";
        await page.setContent(`<button aria-label="${accessible}" onclick="this.dataset.clicked='true'">${visible}</button><button>重置价格</button>`);
        const context = {};
        LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
        setCurrentContext(context);
        try {
            const reset = new Home(page, { version: "6.7.16.0", isSaaS: false, isPaaS: false, features: {} }).resetAllButton;
            await reset.click({ timeout: 1000 });
            await expect(reset).toHaveAttribute("data-clicked", "true");
            await expect(reset).toHaveText(visible);
        } finally {
            setCurrentContext(null);
        }
    });
}

for (const [language, prefix] of [
    ["zh-CN", "含"],
    ["zh-CN", "另加"],
    ["en-GB", "incl."],
    ["en-GB", "plus"],
]) {
    test(`${language} account history reads ${prefix} tax values only for the requested order`, async ({ page }) => {
        const order = language === "zh-CN" ? "订单号" : "Order number";
        const suffix = language === "zh-CN" ? "% 税" : "% VAT";
        const shipping = language === "zh-CN" ? "运费：" : "Shipping costs:";
        const total = language === "zh-CN" ? "总额：" : "Total (gross):";
        await page.setContent(
            `<ul><li><div aria-label="${order} 10007"><dl><dt>${shipping}</dt><dd>¥5.00</dd><dt>${prefix} 19${suffix}</dt><dd>¥3.19</dd><dt>${prefix} 7${suffix}</dt><dd>¥1.31</dd><dt>${prefix} 0${suffix}</dt><dd>¥0.00</dd><dt>${prefix} 7.5${suffix}</dt><dd>¥0.75</dd><dt>${total}</dt><dd>¥99.00</dd></dl></div></li><li><div aria-label="${order} 10008"><dl><dt>${prefix} 19${suffix}</dt><dd>¥9.99</dd></dl></div></li></ul>`
        );
        const context = {};
        LanguageHelper.setForContext(context, await LanguageHelper.createInstance(language));
        setCurrentContext(context);
        try {
            const summary = await new AccountOrder(page).getOrderByOrderNumber("10007");
            await expect(summary.taxPrice).toHaveText(["¥3.19", "¥1.31", "¥0.00", "¥0.75"], { timeout: 1000 });
        } finally {
            setCurrentContext(null);
        }
    });
}
