import { useUser } from '@supabase/auth-helpers-react'
import Navigation from './Navigation'

export default function Layout({ children }) {
  const user = useUser()

  return (
    <div>
      <header>
        <Navigation />
        {user && <p>Logged in as: {user.email}</p>}
      </header>
      <main>{children}</main>
      <footer>© 2024 My App</footer>
    </div>
  )
}