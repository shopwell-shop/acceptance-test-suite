import { test as base } from "@playwright/test";
import type { Task } from "../../../types/Task";
import type { FixtureTypes } from "../../../types/FixtureTypes";

export const SearchForTerm = base.extend<{ SearchForTerm: Task }, FixtureTypes>({
    SearchForTerm: async ({ ShopCustomer, StorefrontSearchSuggest }, use) => {
        const task = (searchTerm: string) => {
            return async function SearchForTerm() {
                await ShopCustomer.fillsIn(StorefrontSearchSuggest.searchInput, searchTerm);
                const isSearchUrl = (url: URL) => url.pathname.endsWith("/search") && url.searchParams.get("search") === searchTerm;
                await Promise.all([
                    StorefrontSearchSuggest.page.waitForURL(isSearchUrl),
                    StorefrontSearchSuggest.page.waitForResponse(
                        (response) => response.request().isNavigationRequest() && response.request().method() === "GET" && isSearchUrl(new URL(response.url())) && response.ok()
                    ),
                    ShopCustomer.presses(StorefrontSearchSuggest.searchInput, "Enter"),
                ]);
            };
        };

        await use(task);
    },
});
