import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Shield,
  Trophy,
  Gift,
  Swords,
  Users,
  TrendingUp,
  Target,
  MessageSquare,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Shield, labelKey: 'nav.myClan' },
  { to: '/rankings', icon: Trophy, labelKey: 'nav.rankings' },
  { to: '/donations', icon: Gift, labelKey: 'nav.donations' },
  { to: '/war-records', icon: Swords, labelKey: 'nav.warRecords' },
  { to: '/war-challenge', icon: Flame, labelKey: 'nav.warChallenge', highlight: true },
  { to: '/activity', icon: Users, labelKey: 'nav.activity' },
  { to: '/trophy-trends', icon: TrendingUp, labelKey: 'nav.trophyTrends' },
  { to: '/war-attacks', icon: Target, labelKey: 'nav.warAttacks' },
  { to: '/guestbook', icon: MessageSquare, labelKey: 'nav.guestbook' },
]

export default function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="hidden lg:flex lg:w-60 flex-col border-r border-border bg-card/30">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          COC Hub
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? item.highlight
                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-primary/10 text-primary border border-primary/20 glow-gold'
                  : item.highlight
                    ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )
            }
          >
            <item.icon className={cn('h-4 w-4', item.highlight && 'animate-pulse')} />
            {t(item.labelKey)}
            {item.highlight && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold">
                HOT
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
