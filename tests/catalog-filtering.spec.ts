import { test, expect } from '../fixtures/cookie-banner';
import { CatalogPage } from '../pages/catalog-page';

test.describe('Catalog filtering', () => {
    test('filtering by make, body type and price range returns only matching results', async ({
        removedCookieBannerPage,
    }) => {
        // Several sequential filter interactions each round-trip to the live
        // staging API; the default 30s budget can be tight under load.
        test.setTimeout(60_000);

        const catalogPage = new CatalogPage(removedCookieBannerPage);
        const make = 'Volkswagen';
        const bodyType = 'Hečbeks';
        const minPrice = 5000;
        const maxPrice = 20000;

        await catalogPage.goto();
        await catalogPage.selectMake(make);
        await catalogPage.selectBodyType(bodyType);
        await catalogPage.setPriceRange(minPrice, maxPrice);

        const resultsCount = await catalogPage.getResultsCount();
        expect(resultsCount).toBeGreaterThan(0);

        const cardsToCheck = Math.min(resultsCount, 3);
        for (let i = 0; i < cardsToCheck; i++) {
            const card = catalogPage.card(i);

            await expect(card.title).toContainText(make);

            await expect
                .poll(() => card.getPriceValue())
                .toBeGreaterThanOrEqual(minPrice);
            await expect
                .poll(() => card.getPriceValue())
                .toBeLessThanOrEqual(maxPrice);
        }
    });

    test('a make + body type combination with no matches shows the empty state', async ({
        removedCookieBannerPage,
    }) => {
        const catalogPage = new CatalogPage(removedCookieBannerPage);
        // BMW doesn't sell microbuses, so this combination is guaranteed to
        // return zero results regardless of what stock is currently on staging.
        const make = 'BMW';
        const bodyType = 'Mikroautobuss';

        await catalogPage.goto();
        await catalogPage.selectMake(make);
        await catalogPage.selectBodyType(bodyType);

        const resultsCount = await catalogPage.getResultsCount();
        expect(resultsCount).toBe(0);

        await expect(catalogPage.resultCards).toHaveCount(0);
        await expect(catalogPage.emptyState).toBeVisible();
    });
});
