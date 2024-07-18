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
    async function fetchProfileAndLastPostDate() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      }
      if (!user) {
        router.push('/login');
      } else {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          // Fetch the latest post date
          const { data: latestPost, error: postError } = await supabase
            .from('posts')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (postError) {
            console.error('Error fetching latest post:', postError);
          } else {
            const lastPostDate = latestPost ? latestPost.created_at : null;
            profileData.last_post_date = lastPostDate;

            setProfile(profileData);
            updateStreak(profileData);
          }
        }
      }
    }
    fetchProfileAndLastPostDate();
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
    console.log("last post was", lastPostDate)
  
    let newStreak = profile.streak;
    let newLastPostDate = profile.last_post_date;

    ///////////NEW CODE HERE TO CHECK. IN NOTEBOOK
    if (lastPostDate === today) {
      //if they posted today, increment
      newStreak+=1
      newLastPostDate = today;
    } else if ((lastPostDate !== yesterday()) && (lastPostDate !== today)) {
      // if they didn't post today and yesterday reset them to 0
      //newStreak += 1;
      //newLastPostDate = today;
      newStreak =0;
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
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
          {posts
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((post) => (
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