import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClanProvider } from '@/contexts/ClanContext'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import RootLayout from '@/components/layout/RootLayout'
import MyClan from '@/pages/MyClan'
import ClanRankings from '@/pages/ClanRankings'
import DonationLeaderboard from '@/pages/DonationLeaderboard'
import ClanWarRecords from '@/pages/ClanWarRecords'
import MemberActivity from '@/pages/MemberActivity'
import TrophyTrends from '@/pages/TrophyTrends'
import WarAttacks from '@/pages/WarAttacks'
import WarChallenge from '@/pages/WarChallenge'
import AdminPanel from '@/pages/AdminPanel'
import Guestbook from '@/pages/Guestbook'
import NotFound from '@/pages/NotFound'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClanProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
              <Route element={<RootLayout />}>
                <Route path="/" element={<MyClan />} />
                <Route path="/rankings" element={<ClanRankings />} />
                <Route path="/donations" element={<DonationLeaderboard />} />
                <Route path="/war-records" element={<ClanWarRecords />} />
                <Route path="/activity" element={<MemberActivity />} />
                <Route path="/trophy-trends" element={<TrophyTrends />} />
                <Route path="/war-attacks" element={<WarAttacks />} />
                <Route path="/war-challenge" element={<WarChallenge />} />
                <Route path="/guestbook" element={<Guestbook />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ClanProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
