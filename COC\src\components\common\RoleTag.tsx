import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const roleColors: Record<string, string> = {
  leader: 'bg-red-500/20 text-red-400 border-red-500/30',
  coLeader: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  member: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export default function RoleTag({ role }: { role: string }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        roleColors[role] || roleColors.member
      )}
    >
      {t(`roles.${role}`)}
    </span>
  )
}
