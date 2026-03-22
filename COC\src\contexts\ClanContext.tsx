import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ClanContextValue {
  clanTag: string
  setClanTag: (tag: string) => void
}

const ClanContext = createContext<ClanContextValue | null>(null)

export function ClanProvider({ children }: { children: ReactNode }) {
  const [clanTag, setClanTagState] = useState<string>(
    () => localStorage.getItem('coc-clan-tag') || ''
  )

  const setClanTag = useCallback((tag: string) => {
    const formatted = tag.startsWith('#') ? tag : `#${tag}`
    setClanTagState(formatted.toUpperCase())
    localStorage.setItem('coc-clan-tag', formatted.toUpperCase())
  }, [])

  return (
    <ClanContext.Provider value={{ clanTag, setClanTag }}>
      {children}
    </ClanContext.Provider>
  )
}

export function useClanContext() {
  const context = useContext(ClanContext)
  if (!context) {
    throw new Error('useClanContext must be used within a ClanProvider')
  }
  return context
}
