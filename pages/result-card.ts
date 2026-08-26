import { type Locator } from '@playwright/test';

export class ResultCard {
    readonly root: Locator;
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly detailChips: Locator;
    readonly price: Locator;

    constructor(root: Locator) {
        this.root = root;
        this.title = root.locator('.vehicle-card-item__title');
        this.subtitle = root.locator('.vehicle-card-item__subtitle');
        this.detailChips = root.locator('.vehicle-card-item__detail-chip');
        this.price = root.locator('.vehicle-card-item__price-value--full');
    }

    async getTitleText(): Promise<string> {
        return (await this.title.innerText()).trim();
    }

    async getPriceValue(): Promise<number> {
        const text = await this.price.innerText();
        return parseInt(text.replace(/\D/g, ''), 10);
    }

    /** Detail chips are rendered as [year, mileage, fuel type]. */
    async getYearValue(): Promise<number> {
        const text = await this.detailChips.nth(0).innerText();
        return parseInt(text.replace(/\D/g, ''), 10);
    }

    async getMileageValue(): Promise<number> {
        const text = await this.detailChips.nth(1).innerText();
        return parseInt(text.replace(/\D/g, ''), 10);
    }
}
