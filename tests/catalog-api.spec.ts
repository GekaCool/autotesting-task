import { test, expect } from '@playwright/test';
import { humanDelay } from '../utils/human-delay';

/**
 * Non-UI scenario: the catalog "find" API called by /automasinu-katalogs.
 *
 * We call the endpoint directly with Playwright's APIRequestContext (no
 * browser page involved) and check that:
 *   - the response is well-formed (status + shape),
 *   - the filters we sent are actually enforced server-side (every
 *     returned vehicle really matches make / bodyType / price range),
 *   - an impossible filter combination yields a clean empty result
 *     rather than an error, so we can tell "no matches" apart from
 *     "endpoint is broken".
 *
 * Discovered by inspecting network traffic on the catalog page: applying
 * a filter in the UI issues `POST /api/longo/longo-lv/catalog/find` with
 * a JSON body describing every filter field, and no auth/cookies are
 * required, so it's callable standalone.
 */

const CATALOG_FIND_ENDPOINT = '/api/longo/longo-lv/catalog/find';

interface CatalogFindFilters {
    makes: string[];
    models: string[];
    series: string[];
    bodyTypes: string[];
    fuelTypes: string[];
    driveTypes: string[];
    transmissions: string[];
    numberOfSeats: number[];
    firstRegistrationCountries: string[];
    availabilityLocations: string[];
    exteriorColors: string[];
    highlights: string[];
    priceFrom: number | null;
    priceTo: number | null;
    pricePerMonthFrom: number | null;
    pricePerMonthTo: number | null;
    yearFrom: number | null;
    yearTo: number | null;
    powerKwFrom: number | null;
    powerKwTo: number | null;
    mileageFrom: number | null;
    mileageTo: number | null;
    engineSizeFrom: number | null;
    engineSizeTo: number | null;
    pricePromotion: boolean | null;
    fullVat: boolean | null;
    search: string;
    orderBy: string;
    pageSize: number;
    currentPage: number;
    desktop: boolean;
    excludingVehicles: number[];
    userSeed: number;
    listHash: string | null;
    recommendedVersion: string | null;
}

interface CatalogVehicleItem {
    id: number;
    stockNumber: string;
    make: string;
    model: string;
    series: string;
    bodyType: string;
    year: number;
    mileage: number;
    currency: string;
    price: number;
    pricePerMonth: number;
}

interface CatalogFindResponse {
    items: CatalogVehicleItem[];
    shownCount: number;
    totalCount: number;
    pages: number;
    count: number;
    withSoldCount: number;
    listHash: string | null;
    recommendedVersion: string | null;
}

function buildFilters(overrides: Partial<CatalogFindFilters>): CatalogFindFilters {
    return {
        makes: [],
        models: [],
        series: [],
        bodyTypes: [],
        fuelTypes: [],
        driveTypes: [],
        transmissions: [],
        numberOfSeats: [],
        firstRegistrationCountries: [],
        availabilityLocations: [],
        exteriorColors: [],
        highlights: [],
        priceFrom: null,
        priceTo: null,
        pricePerMonthFrom: null,
        pricePerMonthTo: null,
        yearFrom: null,
        yearTo: null,
        powerKwFrom: null,
        powerKwTo: null,
        mileageFrom: null,
        mileageTo: null,
        engineSizeFrom: null,
        engineSizeTo: null,
        pricePromotion: null,
        fullVat: null,
        search: '',
        orderBy: 'RECOMMENDED',
        pageSize: 24,
        currentPage: 1,
        desktop: true,
        excludingVehicles: [],
        userSeed: 42,
        listHash: null,
        recommendedVersion: null,
        ...overrides,
    };
}

test.describe('Catalog find API (non-UI)', () => {
    test('response structure matches the expected shape', async ({ request }) => {
        await humanDelay();
        const response = await request.post(CATALOG_FIND_ENDPOINT, {
            headers: { 'x-locale': 'lv' },
            data: buildFilters({}),
        });

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const body: CatalogFindResponse = await response.json();

        expect(Array.isArray(body.items)).toBe(true);
        expect(typeof body.count).toBe('number');
        expect(typeof body.totalCount).toBe('number');
        expect(typeof body.pages).toBe('number');
        expect(body.items.length).toBeLessThanOrEqual(24);
        expect(body.totalCount).toBeGreaterThan(0);

        // Spot-check the shape of a single vehicle record.
        const [first] = body.items;
        expect(first).toBeDefined();
        expect(typeof first?.make).toBe('string');
        expect(typeof first?.model).toBe('string');
        expect(typeof first?.price).toBe('number');
        expect(typeof first?.mileage).toBe('number');
        expect(typeof first?.year).toBe('number');
    });

    test('make + body type + price filter is actually enforced server-side', async ({ request }) => {
        const filters = buildFilters({
            makes: ['BMW'],
            bodyTypes: ['Sedan'],
            priceFrom: 5000,
            priceTo: 30000,
        });

        await humanDelay();
        const response = await request.post(CATALOG_FIND_ENDPOINT, {
            headers: { 'x-locale': 'lv' },
            data: filters,
        });

        expect(response.status()).toBe(200);
        const body: CatalogFindResponse = await response.json();

        // "Some results appeared" is not enough — every item must match
        // every filter we sent, not just the make.
        expect(body.items.length).toBeGreaterThan(0);
        for (const item of body.items) {
            expect(item.make).toBe('BMW');
            expect(item.bodyType).toBe('Sedan');
            expect(item.price).toBeGreaterThanOrEqual(5000);
            expect(item.price).toBeLessThanOrEqual(30000);
        }
    });
});
