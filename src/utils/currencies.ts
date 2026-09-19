import { CurrencyConfig } from '../types';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', name: 'US Dollar', defaultLocale: 'en-US' },
  { code: 'EUR', name: 'Euro', defaultLocale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', defaultLocale: 'en-GB' },
  { code: 'PKR', name: 'Pakistani Rupee', defaultLocale: 'en-PK' },
  { code: 'INR', name: 'Indian Rupee', defaultLocale: 'en-IN' },
  { code: 'AED', name: 'UAE Dirham', defaultLocale: 'en-AE' },
  { code: 'CAD', name: 'Canadian Dollar', defaultLocale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', defaultLocale: 'en-AU' },
  { code: 'JPY', name: 'Japanese Yen', defaultLocale: 'ja-JP' },
  { code: 'SAR', name: 'Saudi Riyal', defaultLocale: 'en-SA' },
  { code: 'SGD', name: 'Singapore Dollar', defaultLocale: 'en-SG' },
  { code: 'CHF', name: 'Swiss Franc', defaultLocale: 'de-CH' },
  { code: 'CNY', name: 'Chinese Yuan', defaultLocale: 'zh-CN' },
  { code: 'BRL', name: 'Brazilian Real', defaultLocale: 'pt-BR' },
  { code: 'MXN', name: 'Mexican Peso', defaultLocale: 'es-MX' },
  { code: 'ZAR', name: 'South African Rand', defaultLocale: 'en-ZA' },
  { code: 'TRY', name: 'Turkish Lira', defaultLocale: 'tr-TR' },
  { code: 'IDR', name: 'Indonesian Rupiah', defaultLocale: 'id-ID' },
  { code: 'MYR', name: 'Malaysian Ringgit', defaultLocale: 'en-MY' },
  { code: 'PHP', name: 'Philippine Peso', defaultLocale: 'en-PH' },
  { code: 'NGN', name: 'Nigerian Naira', defaultLocale: 'en-NG' },
  { code: 'KES', name: 'Kenyan Shilling', defaultLocale: 'en-KE' },
  { code: 'EGP', name: 'Egyptian Pound', defaultLocale: 'ar-EG' },
  { code: 'BDT', name: 'Bangladeshi Taka', defaultLocale: 'bn-BD' },
  { code: 'SEK', name: 'Swedish Krona', defaultLocale: 'sv-SE' },
  { code: 'NOK', name: 'Norwegian Krone', defaultLocale: 'nb-NO' },
  { code: 'NZD', name: 'New Zealand Dollar', defaultLocale: 'en-NZ' },
];

export const COMMON_LOCALES = [
  { code: 'en-US', label: 'English (United States)' },
  { code: 'en-GB', label: 'English (United Kingdom)' },
  { code: 'en-PK', label: 'English (Pakistan)' },
  { code: 'ur-PK', label: 'Urdu (Pakistan)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi (India)' },
  { code: 'en-AE', label: 'English (UAE)' },
  { code: 'ar-AE', label: 'Arabic (UAE)' },
  { code: 'de-DE', label: 'German (Germany)' },
  { code: 'fr-FR', label: 'French (France)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'ja-JP', label: 'Japanese (Japan)' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'es-MX', label: 'Spanish (Mexico)' },
  { code: 'ar-SA', label: 'Arabic (Saudi Arabia)' },
];

/**
 * Formats a monetary amount strictly using Intl.NumberFormat.
 * Zero hardcoded currency symbols.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US',
  options?: {
    showSign?: boolean;
    maximumFractionDigits?: number;
  }
): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      signDisplay: options?.showSign ? 'always' : 'auto',
      maximumFractionDigits: options?.maximumFractionDigits,
    });
    return formatter.format(safeAmount);
  } catch {
    // Graceful fallback using ISO code
    try {
      const fallbackFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      });
      return fallbackFormatter.format(safeAmount);
    } catch {
      return `${currencyCode} ${safeAmount.toLocaleString()}`;
    }
  }
}

/**
 * Validates and sanitizes numeric input string (e.g. from text or number field)
 * Strips non-numeric characters (allowing one decimal dot), disallows negative numbers.
 */
export function parseCleanAmount(input: string): number {
  if (!input) return 0;
  // Strip out currency symbols, letters, spaces, commas
  const cleaned = input.replace(/[^0-9.]/g, '');
  // Keep only the first decimal point
  const parts = cleaned.split('.');
  const sanitized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0];
  const val = parseFloat(sanitized);
  return isNaN(val) || val < 0 ? 0 : val;
}
