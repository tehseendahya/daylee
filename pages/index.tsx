import { useEffect, useState } from 'react'
import { supabase } from '../daylee/lib/supabase'

interface User {
    id: string;
    name: string;
    email: string;
    created_at: string;
  }
  
interface Post {
    id: number;
    user_id: string;
    content: string;
    created_at: string;
    user: User;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
      *,
      user:users(id, name, email, created_at)
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
        const formattedData = data.map((post: any) => ({
            ...post,
            user: post.user ? post.user : "null" // Handle cases where user might be missing
          })) as Post[];
        setPosts(formattedData);
        console.log("POSsssTS: ")
    }
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>
          <p>{post.content}</p>
          <small>Posted by {post.user?.name || "someone"} on {new Date(post.created_at).toLocaleString()}</small>
          
        </div>
      ))}
    </div>
  )
}