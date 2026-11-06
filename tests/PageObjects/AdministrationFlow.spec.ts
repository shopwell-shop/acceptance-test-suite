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
    const mailTemplateId = IdProvider.getIdPair().uuid;
    const mailTemplateTypeId = IdProvider.getIdPair().uuid;
    const mailTemplateName = `flow-mail-${IdProvider.getIdPair().id}`;
    const mailTemplateResponse = await AdminApiContext.post("mail-template", {
        data: {
            id: mailTemplateId,
            mailTemplateTypeId,
            mailTemplateType: {
                id: mailTemplateTypeId,
                technicalName: `flow_contract_${mailTemplateTypeId}`,
                name: mailTemplateName,
                availableEntities: { order: "order" },
            },
            description: mailTemplateName,
            senderName: "Flow contract",
            subject: mailTemplateName,
            contentHtml: "<p>Flow contract</p>",
            contentPlain: "Flow contract",
        },
    });
    expect(mailTemplateResponse.ok()).toBeTruthy();
    TestDataService.addCreatedRecord("mail_template", mailTemplateId);
    TestDataService.addCreatedRecord("mail_template_type", mailTemplateTypeId);
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
            trueActionIdentifier: mailTemplateName,
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
            expect.objectContaining({ actionName: "action.mail.send", trueCase: true, config: expect.objectContaining({ mailTemplateId }) }),
            expect.objectContaining({ actionName: "action.add.order.tag", trueCase: false, config: expect.objectContaining({ entity: "order", tagIds: { [tag.id]: tag.name } }) }),
        ])
    );
});
