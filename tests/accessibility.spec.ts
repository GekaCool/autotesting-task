import { test, expect } from '../fixtures/cookie-banner';
import AxeBuilder from '@axe-core/playwright';

test('should have no serious or critical accessibility violations', async ({ removedCookieBannerPage }) => {
    const results = await new AxeBuilder({ page: removedCookieBannerPage }).analyze();
    const seriousOrCritical = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical'
    );
    expect(seriousOrCritical).toHaveLength(0);
})

