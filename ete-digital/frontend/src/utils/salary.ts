const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
};

function symbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

function fmtAmount(n: number, currency: string): string {
    const sym = symbol(currency);
    if (currency.toUpperCase() === 'INR') {
        return n >= 100000 ? `${sym}${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L` : `${sym}${n.toLocaleString()}`;
    }
    return n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}K` : `${sym}${n.toLocaleString()}`;
}

/** Format job salary range for display. Returns null when undisclosed. */
export function formatJobSalary(
    min: number | null | undefined,
    max: number | null | undefined,
    currency = 'INR',
): string | null {
    if (min == null && max == null) return null;
    if (min != null && max != null) return `${fmtAmount(min, currency)} – ${fmtAmount(max, currency)}`;
    if (min != null) return `${fmtAmount(min, currency)}+`;
    return `Up to ${fmtAmount(max!, currency)}`;
}

export function salaryLabelOrDefault(
    min: number | null | undefined,
    max: number | null | undefined,
    currency = 'INR',
    fallback = 'Competitive salary',
): string {
    return formatJobSalary(min, max, currency) ?? fallback;
}
