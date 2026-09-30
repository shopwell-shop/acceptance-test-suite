import { mergeTests } from "@playwright/test";

import { SaveProduct } from "./shop-admin/Product/SaveProduct";
import { ExpectNotification } from "./shop-admin/ExpectNotification";
import { CreateLinkTypeCategory } from "./shop-admin/Category/CreateLinkTypeCategory";
import { BulkEditProducts } from "./shop-admin/Product/BulkEditProducts";
import { BulkEditCustomers } from "./shop-admin/Customers/BulkEditCustomers";
import { AssignEntitiesToRule } from "./shop-admin/Rule/AssignEntitiesToRule";
import { CreateFlow } from "./shop-admin/Flow/CreateFlow";
import { LoginViaReviewsTab } from "./shop-customer/Account/LoginViaReviewsTab";
import { DeactivateShopwellServices } from "./shop-admin/ShopwellServices/DeactivateShopwellServices";
import { CheckVisibilityOfServicesBanner } from "./shop-admin/ShopwellServices/CheckVisibilityOfServicesBanner";
import { CheckAccessToShopwellServices } from "./shop-admin/ShopwellServices/CheckAccessToShopwellServices";
import { SelectExtensionCategory } from "./shop-admin/FRW/SelectExtensionCategory";

export const test = mergeTests(
    SaveProduct,
    ExpectNotification,
    CreateLinkTypeCategory,
    BulkEditProducts,
    BulkEditCustomers,
    AssignEntitiesToRule,
    CreateFlow,
    LoginViaReviewsTab,
    CheckAccessToShopwellServices,
    CheckVisibilityOfServicesBanner,
    DeactivateShopwellServices,
    SelectExtensionCategory
);
