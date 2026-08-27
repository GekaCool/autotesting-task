import { type Locator, type Page } from '@playwright/test';
import { ResultCard } from './result-card';
import { humanDelay } from '../utils/human-delay';

const RESULTS_COUNT_SELECTOR = '.list-header__count';

export class CatalogPage {
    readonly page: Page;
    readonly makeSection: Locator;
    readonly makeOptions: Locator;
    readonly moreMakesButton: Locator;
    readonly bodyTypeSection: Locator;
    readonly bodyTypeOptions: Locator;
    readonly priceSection: Locator;
    readonly priceFromSelect: Locator;
    readonly priceToSelect: Locator;
    readonly filterChips: Locator;
    readonly resultCards: Locator;
    readonly resultsCount: Locator;
    readonly emptyState: Locator;
    readonly unexpectedErrorTitle: Locator;

    constructor(page: Page) {
        this.page = page;

        this.makeSection = this.filterSection('Marka');
        this.makeOptions = this.makeSection.getByRole('checkbox');
        this.moreMakesButton = this.page.getByRole('button', { name: '+ 20 auto markas +' });

        this.bodyTypeSection = this.filterSection('Virsbūves tips');
        this.bodyTypeOptions = this.bodyTypeSection.getByRole('checkbox');

        this.priceSection = this.filterSection('Cena');
        this.priceFromSelect = this.priceSection.locator('select').first();
        this.priceToSelect = this.priceSection.locator('select').last();

        this.filterChips = this.page.locator('.filter-chip');
        this.resultCards = this.page.locator('.catalog-page__desktop-grid a.vehicle-card-item');
        this.resultsCount = this.page.locator(RESULTS_COUNT_SELECTOR);
        this.emptyState = this.page.locator('.catalog-cant-find-car-card');
        this.unexpectedErrorTitle = this.page.getByText('Neparedzēta kļūme! Lūdzu, mēģ');
    }

    private filterSection(title: string): Locator {
        return this.page
            .locator('section.filter-section')
            .filter({ has: this.page.locator('.filter-section__title', { hasText: title }) });
    }

    async goto() {
        await this.page.goto('/automasinu-katalogs');
        // The catalog is server-rendered and hydrates client-side; wait for the
        // initial count so filter interactions aren't attempted before Vue has
        // attached its click handlers.
        await this.waitForFreshCount();
    }

    async getFullMarksList() {
        await this.moreMakesButton.click();
    }

    async selectMake(make: string) {
        await this.applyFilter(() => this.makeOptions.filter({ hasText: make }).click(), make);
    }

    async selectBodyType(bodyType: string) {
        await this.expandSection(this.bodyTypeSection);
        await this.applyFilter(
            () => this.bodyTypeOptions.filter({ hasText: bodyType }).click(),
            bodyType
        );
    }

    async setPriceRange(min: number, max: number) {
        await this.expandSection(this.priceSection);
        await this.applyFilter(() => this.priceFromSelect.selectOption(String(min)), `€${min}`);

        // Applying the "from" value can re-render the sidebar and collapse the
        // accordion again, so it must be re-opened before touching the "to" select.
        await this.expandSection(this.priceSection);
        await this.applyFilter(() => this.priceToSelect.selectOption(String(max)), `€${max}`);
    }

    /**
     * Runs a filter interaction and waits for two independent confirmations
     * before returning:
     *  - a matching filter chip appears, which reflects the app's selection
     *    state synchronously with the click/select (no network involved);
     *  - the loading placeholder is gone, which confirms the card list has
     *    actually finished re-fetching for the new filter — the chip alone
     *    can appear slightly before the list catches up, which was
     *    previously seen to let a stale, non-matching card slip through an
     *    assertion made right after the chip appeared.
     *
     * Clicking through filters fast enough can also trigger a transient
     * "Neparedzēta kļūme! Lūdzu, mēģ..." error banner instead of a normal
     * re-fetch. When that shows up, give the app 3s to recover, then redo
     * the click/select — the errored attempt never produces a chip/count
     * to wait on, so retrying is what actually applies the filter.
     */
    private async applyFilter(action: () => Promise<unknown>, chipText: string) {
        await humanDelay();
        await action();
        try {
            await this.unexpectedErrorTitle.waitFor({ state: 'visible', timeout: 2000 });
            await this.page.waitForTimeout(3000);
            await action();
        } catch {
            // Error banner never showed up — the request went through normally.
        }
        await this.filterChips.filter({ hasText: chipText }).first().waitFor({ state: 'visible' });
        await this.waitForFreshCount();
    }

    private async expandSection(section: Locator) {
        const body = section.locator('.filter-section__body');
        if (await body.isVisible()) return;

        const deadline = Date.now() + 10_000;
        while (Date.now() < deadline) {
            await section.locator('.filter-section__head').click();
            try {
                await body.waitFor({ state: 'visible', timeout: 1000 });
                return;
            } catch {
                // Sidebar may have re-rendered mid-click; retry until the deadline.
            }
        }
        await body.waitFor({ state: 'visible' });
    }

    /**
     * Waits for the "Lapa atveras..." loading placeholder that briefly
     * replaces the result count while a filter request is in flight to be
     * gone. Doesn't care whether the count actually changed — a filter can
     * legitimately leave it unchanged (e.g. a price bound that doesn't
     * shrink an already-narrow result set).
     */
    private waitForFreshCount() {
        return this.page.waitForFunction(
            (selector) => !(document.querySelector(selector)?.textContent ?? '').includes('atveras'),
            RESULTS_COUNT_SELECTOR
        );
    }

    async getResultsCount(): Promise<number> {
        await this.waitForFreshCount();
        const text = await this.resultsCount.innerText();
        return parseInt(text.replace(/\D/g, ''), 10);
    }

    card(index: number): ResultCard {
        return new ResultCard(this.resultCards.nth(index));
    }
}
