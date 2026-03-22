import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Globe, ChevronDown } from 'lucide-react'
import { useClanContext } from '@/contexts/ClanContext'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { clanTag, setClanTag } = useClanContext()
  const [input, setInput] = useState(clanTag)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'zh', label: '中文', flag: '中' },
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'de', label: 'Deutsch', flag: 'DE' },
  ]

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = () => {
    if (input.trim()) {
      setClanTag(input.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('coc-lang', langCode)
    setShowLangMenu(false)
  }

  const getCurrentLang = () => {
    return languages.find(l => l.code === i18n.language) || languages[0]
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('common.enterClanTag')}
            className="w-full rounded-md border border-input bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('common.search')}
        </button>
      </div>
      <div className="relative" ref={langMenuRef}>
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span>{getCurrentLang().flag}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
        </button>
        {showLangMenu && (
          <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-card shadow-lg overflow-hidden z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${
                  i18n.language === lang.code ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                }`}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
