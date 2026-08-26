import { type Locator, type Page } from '@playwright/test';

export type Locale = 'lv' | 'ru' | 'en';

/**
 * The lv/ru/en switcher in the site header. It's present on every page, so
 * this isn't tied to any single page object.
 */
export class LocaleSwitcher {
    readonly page: Page;
    readonly links: Locator;
    readonly activeLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.links = page.locator('a.locale-switcher__link');
        this.activeLink = page.locator('a.locale-switcher__link--active');
    }

    async switchTo(locale: Locale) {
        await this.links.filter({ hasText: new RegExp(`^${locale}$`, 'i') }).click();
    }

    async getActiveLocaleText(): Promise<string> {
        return ((await this.activeLink.innerText()).toLowerCase()).trim();
    }
}
