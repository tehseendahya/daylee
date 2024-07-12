import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../daylee/lib/supabase'

export default function Callback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else if (data?.session) {
        // Session is already set by Supabase Auth, just redirect
        router.push('/')
      } else {
        console.error('No session found')
      }
    }
    handleAuth()
  }, [router])

  return <div>Loading...</div>
}