import { test as base } from '@playwright/test';
import { expect, type Locator, type Page } from '@playwright/test';
import { humanDelay } from '../utils/human-delay';

type RemovedCookieBannerPage = {
    removedCookieBannerPage: Page;
};

export const test = base.extend<RemovedCookieBannerPage>({
    removedCookieBannerPage: async ({ page }, use) => {
        await page.goto('/');
        await humanDelay();
        await page.getByRole('button', { name: 'Atļaut visu' }).click();
        await use(page);
    }
})
export { expect } from '@playwright/test';