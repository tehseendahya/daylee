import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../daylee/lib/supabase';
import styles from './Home.module.css';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

interface Profile {
  id: string;
  full_name: string;
  email: string;
  updated_at: string;
  avatar_url: string | null;
  streak: number;
  last_post_date: string | null;
}

interface Post {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  profile: Profile;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      }
      if (!user) {
        router.push('/login');
      } else {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (data) {
          setProfile(data);
          updateStreak(data);
        }
      }
    }
    fetchProfile();
  }, [router]);

  useEffect(() => {
    fetchPosts();
  }, [profile]);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles(full_name, avatar_url, streak)
      `);

    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
      const formattedData = data.map((post: any) => ({
        ...post,
        profile: post.profile ? post.profile : { full_name: 'Anonymous', streak: 0 },
      })) as Post[];
      setPosts(formattedData);
    }
  }

  async function updateStreak(profile: Profile) {
    const today = new Date().toISOString().split('T')[0];
    const lastPostDate = profile.last_post_date ? new Date(profile.last_post_date).toISOString().split('T')[0] : null;

    let newStreak = profile.streak;
    let newLastPostDate = profile.last_post_date;

    if (lastPostDate === today) {
      // User has already posted today, do nothing
    } else if (lastPostDate === yesterday()) {
      // User posted yesterday, increment streak
      newStreak += 1;
      newLastPostDate = today;
    } else {
      // User didn't post yesterday, reset streak
      newStreak = 0;
      newLastPostDate = today;
    }

    // Update the profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ streak: newStreak, last_post_date: newLastPostDate })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating streak:', error);
    } else {
      setProfile({ ...profile, streak: newStreak, last_post_date: newLastPostDate });
    }
  }

  function yesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      setProfile(null);
      router.push('/login');
    }
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {profile ? (
          <>
            <span className={styles.greeting}>Hello, {profile.full_name}</span>
            <span className={styles.streak}>Streak: {profile.streak}</span>
            <button onClick={handleSignOut} className={styles.button}>
              Sign Out
            </button>
            <button onClick={() => router.push('/profile')} className={styles.button}>
              My Profile
            </button>
          </>
        ) : (
          <button onClick={() => router.push('/login')} className={styles.button}>
            Login
          </button>
        )}
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
                  Posted by{' '}
                  <button
                    onClick={() => handleProfileClick(post.user_id)}
                    className={styles.profileButton}
                  >
                    {post.profile.full_name || 'Anonymous'}
                  </button>
                  <span className={styles.streak}> (Streak: {post.profile.streak})</span>
                </span>
                <span className={styles.postDate}>
                  on {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noPosts}>You must login to see posts.</div>
      )}
    </div>
  );
}