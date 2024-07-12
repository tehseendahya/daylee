import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // Assuming you're using Next.js
import { supabase } from '../daylee/lib/supabase';
import styles from './Home.module.css';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Use router for navigation

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:users(name)
      `);

    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
      const formattedData = data.map((post: any) => ({
        ...post,
        user: post.user ? post.user : { name: 'Anonymous' },
      })) as Post[];
      setPosts(formattedData);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push('/login')} className={styles.button}>
          Login
        </button>
        <button onClick={() => router.push('/post')} className={styles.button}>
          Post
        </button>
      </div>
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
                  Posted by {post.user.name || 'Anonymous'}
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
  );
}
