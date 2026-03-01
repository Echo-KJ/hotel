// src/lib/tax/sac.ts
// SAC Codes for hotel services (India)
// Reference: GST Council notification

export const SAC_CODES: Record<string, { code: string; description: string }> = {
    room: { code: '998111', description: 'Accommodation in hotels, inns, clubs, etc.' },
    food: { code: '996311', description: 'Room service and restaurant services' },
    laundry: { code: '998713', description: 'Laundry, dry-cleaning and dyeing services' },
    minibar: { code: '996311', description: 'Minibar / beverage service' },
    spa: { code: '999721', description: 'Spa and wellness services' },
    transport: { code: '996411', description: 'Local transport service' },
    other: { code: '999799', description: 'Other miscellaneous services' },
};

export function getSACCode(chargeType: string): string {
    return SAC_CODES[chargeType]?.code ?? SAC_CODES.other.code;
}
