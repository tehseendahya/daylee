import { useUser } from '@supabase/auth-helpers-react'
import Link from 'next/link'

export default function Navigation() {
  const user = useUser()

  return (
    <nav>
      <Link href="/">Home</Link>
      {user ? (
        <>
          <Link href="/profile">Profile</Link>
          <button>Logout</button>
        </>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </nav>
  )
}