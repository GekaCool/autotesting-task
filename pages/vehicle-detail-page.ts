import { type Locator, type Page } from '@playwright/test';

export class VehicleDetailPage {
    readonly page: Page;
    readonly title: Locator;
    readonly price: Locator;
    readonly mileageChip: Locator;

    constructor(page: Page) {
        this.page = page;
        this.title = page.locator('h3.desktop-vehicle-header__title');
        // The price block is duplicated for a sticky/compact header variant.
        this.price = page.locator('.desktop-vehicle-header-price__price').first();
        // Header chips are [mileage, transmission, engine size, fuel, drivetrain].
        this.mileageChip = page.locator('.desktop-vehicle-header__chips .chip--large').first();
    }

    /** Title is rendered as "<year> <make> <model...> <trim>". */
    async getTitleText(): Promise<string> {
        return (await this.title.innerText()).trim();
    }

    async getYearValue(): Promise<number> {
        const title = await this.getTitleText();
        return parseInt(title, 10);
    }

    async getPriceValue(): Promise<number> {
        const text = await this.price.innerText();
        return parseInt(text.replace(/\D/g, ''), 10);
    }

    async getMileageValue(): Promise<number> {
        const text = await this.mileageChip.innerText();
        return parseInt(text.replace(/\D/g, ''), 10);
    }
}
