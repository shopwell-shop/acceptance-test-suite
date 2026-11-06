import { test, expect } from "../../src";

test("Customers can log in through the public review task and persist a review", async ({
    ShopCustomer,
    TestDataService,
    StorefrontProductDetail,
    LoginViaReviewsTab,
    AdminApiContext,
    Translate,
}) => {
    const product = await TestDataService.createBasicProduct();
    const customer = await TestDataService.createCustomer();
    await ShopCustomer.attemptsTo(LoginViaReviewsTab(product, customer));
    await ShopCustomer.presses(StorefrontProductDetail.reviewsTab);
    await ShopCustomer.presses(StorefrontProductDetail.reviewTeaserButton);
    await ShopCustomer.selectsRadioButton(StorefrontProductDetail.reviewRatingPoints, Translate("storefront:product:review.rating4"), true);
    const title = `${product.name} review`;
    const content = `${product.name} is useful and reliable. This review verifies the public customer login and submission flow.`;
    await StorefrontProductDetail.reviewTitleInput.fill(title);
    await StorefrontProductDetail.reviewReviewTextInput.fill(content);
    await StorefrontProductDetail.reviewSubmitButton.click();
    await expect(StorefrontProductDetail.reviewSubmitMessage).toBeVisible();
    const response = await AdminApiContext.post("search/product-review", { data: { filter: [{ type: "equals", field: "productId", value: product.id }] } });
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).data).toEqual([expect.objectContaining({ productId: product.id, customerId: customer.id, title, content, points: 4 })]);
});

test("The public review filter separates a rating from its longer Chinese label", async ({
    ShopCustomer,
    TestDataService,
    StorefrontProductDetail,
    SelectProductReviewOption,
    Translate,
}) => {
    const product = await TestDataService.createBasicProduct();
    await TestDataService.createProductReview(product.id, { title: "Four point review", points: 4 });
    await TestDataService.createProductReview(product.id, { title: "Five point review", points: 5 });
    await ShopCustomer.goesTo(StorefrontProductDetail.url(product));
    await ShopCustomer.presses(StorefrontProductDetail.reviewsTab);
    await expect(StorefrontProductDetail.reviewListingItems).toHaveCount(2);
    const rating = Translate("storefront:product:review.rating4");
    await ShopCustomer.attemptsTo(SelectProductReviewOption(rating));
    await expect(StorefrontProductDetail.reviewListingItems).toHaveCount(1);
    await expect(StorefrontProductDetail.reviewItemTitle).toHaveText("Four point review");
    const other = await StorefrontProductDetail.getReviewFilterRowOptionsByName(Translate("storefront:product:review.rating5"));
    await expect(other.reviewFilterOptionCheckbox).not.toBeChecked();
    await ShopCustomer.attemptsTo(SelectProductReviewOption(`${rating} (1)`));
    await expect(StorefrontProductDetail.reviewListingItems).toHaveCount(2);
});
