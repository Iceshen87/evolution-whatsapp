export function formatTag(tag: string): string {
  const t = tag.trim().toUpperCase()
  return t.startsWith('#') ? t : `#${t}`
}

export function encodeTag(tag: string): string {
  return encodeURIComponent(tag)
}
