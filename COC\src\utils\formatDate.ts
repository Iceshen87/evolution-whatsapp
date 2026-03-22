export function formatCocDate(dateStr: string): string {
  if (!dateStr) return ''
  // COC API date format: "20231215T123456.000Z"
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  return `${year}-${month}-${day}`
}

export function formatCocDateLocale(dateStr: string, locale: string): string {
  if (!dateStr) return ''
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  const date = new Date(year, month, day)
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
