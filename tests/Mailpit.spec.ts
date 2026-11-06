import { test, expect, translate } from "../src";

test(
    "Verify sign-up email",
    { tag: "@Email" },
    async ({ IdProvider, MailpitApiContext, InstanceMeta, DefaultSalesChannel, Register, ShopCustomer, StorefrontAccountLogin, StorefrontAccount }) => {
        test.skip(InstanceMeta.isSaaS, "Skipping test because it requires a local mailpit instance.");

        // Register through the storefront to trigger the registration mail.
        const email = IdProvider.getIdPair().id + "@test.com";
        const password = "shopwell";
        await ShopCustomer.goesTo(StorefrontAccountLogin.url());
        await ShopCustomer.attemptsTo(Register({ email, password }));
        await ShopCustomer.expects(StorefrontAccount.page.getByText(email, { exact: true })).toBeVisible();

        // Create email page
        let emailContent = "";
        await expect(async () => {
            emailContent = await MailpitApiContext.generateEmailContent(email);
            expect(emailContent).toContain(email);
        }).toPass({ timeout: 30_000 });
        const url = "http://email";
        const emailVerificationPage = StorefrontAccount.page;
        await emailVerificationPage.route(url, (route) => {
            route.fulfill({ body: emailContent, contentType: "text/html; charset=utf-8" });
        });

        // Verify email content
        await emailVerificationPage.goto(url);
        await expect(emailVerificationPage.locator("#from")).toContainText("doNotReply@localhost.com");
        await expect(emailVerificationPage.locator("#to")).toContainText(email);
        await expect(emailVerificationPage.locator("#subject")).toContainText(
            translate("storefront:account:registrationEmailSubject", { salesChannel: DefaultSalesChannel.salesChannel.name })
        );
        await expect(emailVerificationPage.locator("p").last()).toContainText(email);
    }
);
