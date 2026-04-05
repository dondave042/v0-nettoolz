// Exchange rate: 1 USD = 1550 NGN (approximate, can be updated)
const USD_TO_NGN_RATE = 1550

export function convertUsdToNgn(usdAmount: number): number {
  return Math.round(usdAmount * USD_TO_NGN_RATE)
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPrice(usdAmount: number): string {
  const ngnAmount = convertUsdToNgn(usdAmount)
  return formatNaira(ngnAmount)
}
