import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Shield,
  Trophy,
  Gift,
  Swords,
  Users,
  TrendingUp,
  Target,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Header from './Header'
import Sidebar from './Sidebar'

const navItems = [
  { to: '/', icon: Shield, labelKey: 'nav.myClan' },
  { to: '/rankings', icon: Trophy, labelKey: 'nav.rankings' },
  { to: '/donations', icon: Gift, labelKey: 'nav.donations' },
  { to: '/war-records', icon: Swords, labelKey: 'nav.warRecords' },
  { to: '/activity', icon: Users, labelKey: 'nav.activity' },
  { to: '/trophy-trends', icon: TrendingUp, labelKey: 'nav.trophyTrends' },
  { to: '/war-attacks', icon: Target, labelKey: 'nav.warAttacks' },
]

export default function RootLayout() {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-card border-r border-border flex flex-col">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                COC Hub
              </span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center lg:hidden px-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
        {/* Footer */}
        <footer className="border-t border-border bg-card/30 px-4 py-3 text-center text-xs text-muted-foreground">
          <p>
            {t('common.contact')}: <a href="mailto:robinshen36@gmail.com" className="text-primary hover:underline">robinshen36@gmail.com</a> · {t('common.contactDesc')}
          </p>
        </footer>
      </div>
    </div>
  )
}
