import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Format a date to a string
 * @param date - Date to format
 * @param formatStr - Format string for date-fns
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Data inválida';
    }
    
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Erro ao formatar data';
  }
}

/**
 * Format a currency value
 * @param value - Number or string value to format
 * @param locale - Locale for formatting (default: pt-BR)
 * @param currency - Currency code (default: BRL)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string | null | undefined,
  locale: string = 'pt-BR',
  currency: string = 'BRL'
): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  try {
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numberValue)) {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return 'R$ 0,00';
  }
}

/**
 * Calculate the difference between two dates in days
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between dates
 */
export function daysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns Boolean indicating if date is in the past
 */
export function isDatePast(date: Date | string): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}

/**
 * Get the month name from a date
 * @param date - Date to extract month name from
 * @returns Month name
 */
export function getMonthName(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMMM', { locale: ptBR });
}

/**
 * Get the current year
 * @returns Current year as number
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get an array of all months
 * @returns Array of month names
 */
export function getAllMonths(): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2023, i, 1);
    return format(date, 'MMMM', { locale: ptBR });
  });
}