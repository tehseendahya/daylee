import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../../daylee/lib/supabase';
import { useRouter } from 'next/router';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import styles from './Post.module.css';

export default function Post() {
  const [content, setContent] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      }
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    }
    fetchUser();
  }, [router]);

  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content });
    
    if (error) {
      alert(error.message);
    } else {
      setContent('');
      alert('Post created!');
      router.push('/'); // Redirect to the main page
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create a New Post</h1>
      {/*}
      <div className={styles.imageContainer}>
        <Image 
          src="/pages/post/shot.png"
          alt="Elon wants to know what you got done" 
          width={200} 
          height={200} 
          className={styles.image}
        />
      </div>
      */}
      <form onSubmit={handlePost} className={styles.form}>
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          required 
          className={styles.textarea}
          placeholder="What did you get done today?"
        />
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.button}>Post</button>
          <button type="button" className={styles.button} onClick={() => router.push('/')}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
