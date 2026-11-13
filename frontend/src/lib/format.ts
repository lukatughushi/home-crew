/** 1450 → "1 450 ₾", 122.5 → "122.50 ₾" */
export function formatPrice(n: number): string {
  const s = n.toLocaleString('en-US', {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return s.replace(/,/g, ' ') + ' ₾'
}

/** "49 ₾-დან"; empty when the service has no packages yet */
export function formatFrom(n: number | null): string {
  return n === null ? '' : formatPrice(n) + '-დან'
}

/** 2318 → "2 318" */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US').replace(/,/g, ' ')
}
