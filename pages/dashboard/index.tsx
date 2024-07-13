import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Dashboard() {
  const user = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user])

  if (!user) return null // or a loading spinner

  return <div>Welcome to your dashboard, {user.email}</div>
}