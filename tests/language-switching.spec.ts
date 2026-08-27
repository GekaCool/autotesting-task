import { test, expect } from '../fixtures/cookie-banner';
import { CatalogPage } from '../pages/catalog-page';
import { LocaleSwitcher } from '../pages/locale-switcher';
import { humanDelay } from '../utils/human-delay';

test.describe('Language switching', () => {
    test('switching to English updates the URL and content, and persists across navigation', async ({
        removedCookieBannerPage,
    }) => {
        const catalogPage = new CatalogPage(removedCookieBannerPage);
        const localeSwitcher = new LocaleSwitcher(removedCookieBannerPage);

        await catalogPage.goto();
        await humanDelay();
        await localeSwitcher.switchTo('en');
        // URL reflects the locale change — the catalog route itself is
        // translated (/automasinu-katalogs -> /en/catalog), not just prefixed.
        await expect(removedCookieBannerPage).toHaveURL(/\/en\/catalog/);
        // Visible content reflects the change too.
        await expect(catalogPage.resultsCount).toHaveText(/results/i);
        expect(await localeSwitcher.getActiveLocaleText()).toBe('en');

        // Persists across a page navigation to an unrelated route.
        await humanDelay();
        await removedCookieBannerPage.getByRole('link', { name: 'Financing', exact: true }).click();

        await expect(removedCookieBannerPage).toHaveURL(/\/en\/financing/);
    });
});
