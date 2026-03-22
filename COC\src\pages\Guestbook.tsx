import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, User, AlertCircle } from 'lucide-react'
import axios from 'axios'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface Message {
  id: string
  nickname: string
  content: string
  ip: string
  createdAt: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

export default function Guestbook() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [duplicateIp, setDuplicateIp] = useState(false)

  const { data, isLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ['guestbook-messages'],
    queryFn: async () => {
      const { data } = await axios.get('/site/messages')
      return data
    },
    refetchInterval: 15000,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await axios.post('/site/messages', { nickname, content })
    },
    onSuccess: () => {
      setContent('')
      setSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ['guestbook-messages'] })
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setDuplicateIp(true)
      }
    },
  })

  const handleSubmit = () => {
    if (!content.trim()) return
    mutation.mutate()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formDisabled = submitted || duplicateIp

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        {t('guestbook.title')}
      </h1>

      {/* Submit Form */}
      <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm space-y-3">
        {formDisabled ? (
          <div className="flex items-center gap-3 py-4 justify-center">
            <AlertCircle className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {duplicateIp ? t('guestbook.alreadySubmitted') : t('guestbook.success')}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('guestbook.nicknamePlaceholder')}
                className="flex-1 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('guestbook.contentPlaceholder')}
              rows={3}
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('guestbook.hint')}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || mutation.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {mutation.isPending ? t('common.loading') : t('guestbook.submit')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Message Table */}
      {isLoading && <LoadingSpinner />}

      {data?.messages && (
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">{t('guestbook.colNickname')}</th>
                  <th className="text-left py-3 px-4">IP</th>
                  <th className="text-left py-3 px-4">{t('guestbook.colContent')}</th>
                  <th className="text-left py-3 px-4">{t('guestbook.colTime')}</th>
                </tr>
              </thead>
              <tbody>
                {data.messages.map((msg, i) => (
                  <tr key={msg.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-4 font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {msg.nickname}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-mono text-xs text-muted-foreground">{msg.ip}</td>
                    <td className="py-2 px-4 text-muted-foreground max-w-md">
                      <p className="whitespace-pre-wrap line-clamp-3">{msg.content}</p>
                    </td>
                    <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">{formatTime(msg.createdAt)}</td>
                  </tr>
                ))}
                {data.messages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">{t('guestbook.empty')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
