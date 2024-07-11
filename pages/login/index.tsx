import { useState, FormEvent } from 'react'
import { supabase } from '../../daylee/lib/supabase'
import { useRouter } from 'next/router'
import styles from './index.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (useMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: isSignUp,
          emailRedirectTo: 'https://example.com/welcome', // Replace with your redirect URL
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMagicLinkSent(true)
      }
    } else {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) {
          setError(error.message)
        } else {
          alert('Check your email for the confirmation link!')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message)
        } else {
          router.push('/')
        }
      }
    }

    setIsLoading(false)
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2 className={styles.formTitle}>{isSignUp ? 'Sign Up' : 'Login'}</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        {magicLinkSent && <p className={styles.successMessage}>Check your email for the magic link!</p>}
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="Enter your email"
          />
        </div>
        {!useMagicLink && (
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Enter your password"
            />
          </div>
        )}
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="useMagicLink"
            checked={useMagicLink}
            onChange={() => setUseMagicLink(!useMagicLink)}
          />
          <label htmlFor="useMagicLink">Use Magic Link</label>
        </div>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading || magicLinkSent}
        >
          {isLoading ? 'Processing...' : (useMagicLink ? 'Send Magic Link' : (isSignUp ? 'Sign Up' : 'Login'))}
        </button>
        <p className={styles.toggleText}>
          {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)} 
            className={styles.toggleButton}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  )
}