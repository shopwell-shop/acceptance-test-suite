import { test, expect } from "../../src";

test("CreateFlow retains the configured condition, email and tag with localized action labels", async ({
    ShopAdmin,
    AdminFlowBuilderListing,
    AdminApiContext,
    IdProvider,
    TestDataService,
    CreateFlow,
    Translate,
}) => {
    const tag = await TestDataService.createTag(`flow-tag-${IdProvider.getIdPair().id}`);
    const rule = await TestDataService.createBasicRule();
    const name = `flow-${IdProvider.getIdPair().id}`;
    await ShopAdmin.goesTo(AdminFlowBuilderListing.url());
    await ShopAdmin.attemptsTo(
        CreateFlow({
            name,
            description: "Public flow task persistence regression",
            priority: "1",
            active: true,
            triggerSearchTerm: Translate("administration:flowBuilder:triggers.placed"),
            triggerLabel: (["checkout", "order", "placed"] as const).map((part) => Translate(`administration:flowBuilder:triggers.${part}`)).join(" / "),
            condition: rule.name,
            trueAction: Translate("administration:flowBuilder:actions.mailSend"),
            trueActionIdentifier: "Order confirmation",
            falseAction: Translate("administration:flowBuilder:actions.addTag"),
            falseActionIdentifier: tag.name,
        })
    );
    const response = await AdminApiContext.post("search/flow", {
        data: {
            filter: [{ type: "equals", field: "name", value: name }],
            associations: { sequences: {} },
        },
    });
    expect(response.ok()).toBeTruthy();
    const saved = (await response.json()).data;
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name, eventName: "checkout.order.placed", active: true, priority: 1 });
    expect(saved[0].sequences).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ ruleId: rule.id }),
            expect.objectContaining({ actionName: "action.mail.send", trueCase: true, config: expect.objectContaining({ mailTemplateId: expect.any(String) }) }),
            expect.objectContaining({ actionName: "action.add.order.tag", trueCase: false, config: expect.objectContaining({ entity: "order", tagIds: { [tag.id]: tag.name } }) }),
        ])
    );
});
