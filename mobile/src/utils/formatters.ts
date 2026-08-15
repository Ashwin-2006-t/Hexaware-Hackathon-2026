/**
 * Format a number into Indian Rupee Currency (₹ INR) with standard Indian Number Grouping.
 * Example: 350 -> "₹350", 1200 -> "₹1,200", 150000 -> "₹1,50,000"
 */
export function formatINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0'
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric)
}
