import { getGSTRates, calculateGST, extractGSTFromGrandTotal } from '../gst';

describe('getGSTRates — slab boundaries', () => {
    test('₹0/night → 0%', () => expect(getGSTRates(0).totalRate).toBe(0));
    test('₹999/night → 0%', () => expect(getGSTRates(999).totalRate).toBe(0));
    test('₹1000/night → 0%', () => expect(getGSTRates(1000).totalRate).toBe(0));
    test('₹1001/night → 12%', () => expect(getGSTRates(1001).totalRate).toBeCloseTo(0.12));
    test('₹7500/night → 12%', () => expect(getGSTRates(7500).totalRate).toBeCloseTo(0.12));
    test('₹7501/night → 18%', () => expect(getGSTRates(7501).totalRate).toBeCloseTo(0.18));
    test('₹15000/night → 18%', () => expect(getGSTRates(15000).totalRate).toBeCloseTo(0.18));
});

describe('calculateGST — amount correctness', () => {
    test('Base ₹10000 at ₹800/night → no GST', () => {
        const r = calculateGST(10000, 800);
        expect(r.cgstAmount).toBe(0);
        expect(r.sgstAmount).toBe(0);
        expect(r.grandTotal).toBe(10000);
    });
    test('Base ₹10000 at ₹2000/night → 12%', () => {
        const r = calculateGST(10000, 2000);
        expect(r.cgstAmount).toBe(600);
        expect(r.sgstAmount).toBe(600);
        expect(r.grandTotal).toBe(11200);
    });
    test('Base ₹10000 at ₹10000/night → 18%', () => {
        const r = calculateGST(10000, 10000);
        expect(r.cgstAmount).toBe(900);
        expect(r.sgstAmount).toBe(900);
        expect(r.grandTotal).toBe(11800);
    });
    test('Handles ₹0 base amount', () => {
        const r = calculateGST(0, 5000);
        expect(r.grandTotal).toBe(0);
    });
    test('Throws on negative base', () => {
        expect(() => calculateGST(-100, 2000)).toThrow();
    });
});

describe('extractGSTFromGrandTotal — reverse calculation', () => {
    test('₹11200 at 12% → base ₹10000', () => {
        const r = extractGSTFromGrandTotal(11200, 2000);
        expect(r.baseAmount).toBeCloseTo(10000, 1);
        expect(r.cgstAmount).toBeCloseTo(600, 1);
    });
});
