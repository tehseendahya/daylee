import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../daylee/lib/supabase'
import { useRouter } from 'next/router'
import { User } from '@supabase/supabase-js'

export default function Post() {
  const [content, setContent] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
            console.error('Error fetching user:', error)
        }
        if (!user) {
        router.push('/login')
        } else {
        setUser(user)
        }
    }
    fetchUser()
  }, [router])


  const handlePost = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content })
    
    if (error) {
      alert(error.message)
    } else {
      setContent('')
      alert('Post created!')
    }
  }

  return (
    <form onSubmit={handlePost}>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} required />
      <button type="submit">Post</button>
    </form>
  )
}