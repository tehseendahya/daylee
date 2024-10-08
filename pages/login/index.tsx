import { useState, FormEvent } from 'react';
import { supabase } from '../../daylee/lib/supabase';
import { useRouter } from 'next/router';
import styles from './index.module.css';
import { AuthError } from '@supabase/supabase-js';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://postdaylee.com/post'
      },
    });
    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const performAction = async (): Promise<{ error: AuthError | null }> => {
      console.log("issue here 1")
      if (isSignUp) {
        console.log("issue here 2")
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        console.log("data here", data.user)
        console.log("error is", error)
        if (data.user) {
          
          // Save the name to the profiles table
          const { error: profileError } = await supabase
    
            .from('profiles')
            
            .update({
              //id: data.user.id,
              full_name: name,
              email: email,
            })
            .match({
              id: data.user.id
            });

            console.log('profile error', profileError)
          if (profileError) {
            throw profileError;
          }
        }
        return { error };
      } else {
        return await supabase.auth.signInWithPassword({ email, password });
      }
    };

    try {
      const { error } = await performAction();

      if (error) {
        if (error.status === 429) {
          setError('Too many sign-up attempts in 1 hour. Login with Google instead');
        } else {
          setError(error.message);
        }
      } else {
        if (isSignUp) {
          alert('Check your email for the confirmation link!');
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      console.log(error);
      setError('An unexpected error occurred. Please use google for now.');
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.formContainer}>
      <Head>
        <title>{isSignUp ? 'Sign Up' : 'Log In'} - PostDayLee</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Access your daylee account or create a new one. Multiple login options available including email and Google sign-in." />
      </Head>
  
      <h1 className={styles.heading1}>Welcome to daylee</h1>
      <p className={styles.paragraph}>Access your account or create a new one to get started.</p>
  
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2 className={styles.formTitle}>{isSignUp ? 'Sign Up' : 'Login'}</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        {isSignUp ? (
          <div className={styles.inputGroup}>
            <label htmlFor="name">Name</label>
            <input 
              type="text" 
              id="name"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="Enter your name"
            />
          </div>
        ) : ""}
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
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
        </button>
        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          className={styles.googleButton}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Sign in with Google'}
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
  
      <Analytics />
      <SpeedInsights />
    </div>
  )
}