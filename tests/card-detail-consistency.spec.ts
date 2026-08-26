import { test, expect } from '../fixtures/cookie-banner';
import { CatalogPage } from '../pages/catalog-page';
import { VehicleDetailPage } from '../pages/vehicle-detail-page';

test.describe('Card to detail page consistency', () => {
    test('price, model, year and mileage on the detail page match the catalog card', async ({
        removedCookieBannerPage,
    }) => {
        const catalogPage = new CatalogPage(removedCookieBannerPage);
        await catalogPage.goto();

        const card = catalogPage.card(0);
        const cardModel = await card.getTitleText();
        const cardYear = await card.getYearValue();
        const cardMileage = await card.getMileageValue();
        const cardPrice = await card.getPriceValue();

        await card.root.click();

        const detailPage = new VehicleDetailPage(removedCookieBannerPage);
        await expect(detailPage.title).toBeVisible();

        // Detail title is "<year> <make> <model...> <trim>" — the card's
        // make/model text is a substring of it.
        const detailTitle = await detailPage.getTitleText();
        expect(detailTitle).toContain(cardModel);

        expect(await detailPage.getYearValue()).toBe(cardYear);
        expect(await detailPage.getMileageValue()).toBe(cardMileage);
        expect(await detailPage.getPriceValue()).toBe(cardPrice);
    });
});
