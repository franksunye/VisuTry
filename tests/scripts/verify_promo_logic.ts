
import { resolvePromoCode, getProductQuota, calculateRemainingQuota, PROMO_MAPPING, QUOTA_CONFIG } from "../../src/config/pricing";

console.log("Verifying Production-Aligned Pricing Config...");

console.log(`Base Quotas -> Credits: ${QUOTA_CONFIG.CREDITS_PACK}, Monthly: ${QUOTA_CONFIG.MONTHLY_SUBSCRIPTION}, Yearly: ${QUOTA_CONFIG.YEARLY_SUBSCRIPTION}`);

const testCases = [
    { id: "CREDITS_PACK", expected: 30, promoId: "CREDITS_PACK_PROMO_60", promoExpected: 60 },
    { id: "PREMIUM_MONTHLY", expected: 90, promoId: "PREMIUM_MONTHLY_PROMO", promoExpected: 180 },
    { id: "PREMIUM_YEARLY", expected: 1260, promoId: "PREMIUM_YEARLY_PROMO", promoExpected: 2520 },
];

testCases.forEach(({ id, expected, promoId, promoExpected }) => {
    // 1. Check Standard Quota
    const quota = getProductQuota(id as any);
    console.log(`[${id}] Standard Quota: ${quota} (Expected: ${expected})`);
    if (quota !== expected) throw new Error(`${id} quota mismatch`);

    // 2. Check Promo Mapping
    const mappedPromo = PROMO_MAPPING[id];
    console.log(`[${id}] Mapped Promo: ${mappedPromo} (Expected: ${promoId})`);
    if (mappedPromo !== promoId) throw new Error(`${id} mapping mismatch`);

    // 3. Check Promo Quota
    const pQuota = getProductQuota(promoId as any);
    console.log(`[${id}] Promo Quota: ${pQuota} (Expected: ${promoExpected})`);
    if (pQuota !== promoExpected) throw new Error(`${promoId} quota mismatch`);
});

console.log("\n✅ All Production-Aligned checks passed!");
