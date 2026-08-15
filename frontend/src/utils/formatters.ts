/**
 * Formats a numeric amount into Indian Rupee currency (₹ INR)
 * using Indian digit grouping (e.g., ₹1,500, ₹1,00,000 style).
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0'
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formats date string into Indian standard date format (DD/MM/YYYY or 14 Aug 2026).
 */
export function formatIndianDate(dateString: string): string {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d)
  } catch {
    return dateString
  }
}
