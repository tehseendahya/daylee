import { useEffect, useState } from 'react'
import { supabase } from '../daylee/lib/supabase'
import styles from './Home.module.css'

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
  user: User
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  //I switched this to false. IDK if this is a problem
  //switch back to true once I get user to load
  const [isLoading, setIsLoading] = useState(false)




  useEffect(() => {
    fetchPosts()
    //testing
  }, [])




  async function fetchPosts() {

    //console.log("user is", await supabase.from('users').select('email'));


    //My PROBLEMS
    //1. (FIXED) users is not showing any data at all --> Impacts posts displayed
    //2. I can't figure out how to sign up for the platform --> Doesn't allow you to post

    //Next steps
    ///1. Make it so you have to post first to see others' posts
    ///2. You can only see your followers and following's posts
    ///3. Images


    const { data, error } = await supabase
      .from('posts')
      .select(`
      *,
      user:users(name)
      `)
    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
      const formattedData = data.map((post: any) => {
        console.log('name for post', post.user?.name || "Anonymous");
        return {
          ...post,
          user: post.user ? post.user : { name: "Anonymous" }
         // Handle cases where user might be missing
        };
      }) as Post[];
      setPosts(formattedData);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Recent Posts</h1>
      {isLoading ? (
        <div className={styles.loading}>Loading posts...</div>
      ) : posts.length > 0 ? (
        <div className={styles.postList}>
          {posts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <p className={styles.postContent}>{post.content}</p>
              <div className={styles.postMeta}>
                <span className={styles.postAuthor}>
                  Posted by {post.user.name || "Anonymous"}
                </span>
                <span className={styles.postDate}>
                  on {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noPosts}>No posts found.</div>
      )}
    </div>
  )
}