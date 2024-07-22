import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../daylee/lib/supabase';
import styles from './Home.module.css';
import { Analytics } from "@vercel/analytics/react"; // Importing Analytics
import { SpeedInsights } from "@vercel/speed-insights/next"; // Importing SpeedInsights

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
  const [initialFetchDone, setInitialFetchDone] = useState(false); // New state to track fetch completion
  const [offset, setOffset] = useState(0); //for the "load more" feature
  //for offset
  const offsetValue = 7;
  const [hasMorePosts, setHasMorePosts] = useState(true); // New state to track if there are more posts

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
            setInitialFetchDone(true); // Mark initial fetch as done
          }
        }
      }
    }
    fetchProfileAndLastPostDate();
  }, [router]);

  useEffect(() => {
    if (initialFetchDone) {
      fetchPosts();
      if (profile) {
        updateStreak(profile);
      }
    }
  }, [profile, initialFetchDone]);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles(full_name, avatar_url, streak)
      `)
      .order('created_at', { ascending: false })
      //OFFSET STUFF
      //.range(offset, offset + (offsetValue - 1));

    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
      const formattedData = data.map((post: any) => ({
        ...post,
        profile: post.profile ? post.profile : { full_name: 'Anonymous', streak: 0, avatar_url: "" },
      })) as Post[];

      
      setPosts(formattedData);
    }
  }

  //function loadMorePosts() {
  //  setOffset(offset + offsetValue);
  //  console.log(posts.length)
   // fetchPosts();
 // }

  async function updateStreak(profile: Profile) {
    if (!profile) return; // Ensure profile is available

    const today = new Date().toISOString().split('T')[0];
    const lastPostDate = profile.last_post_date ? new Date(profile.last_post_date).toISOString().split('T')[0] : null;

    let newStreak = profile.streak;

    if (lastPostDate === null) {
      newStreak = 0; // First post ever
    } else {
      const lastPostDateObj = new Date(lastPostDate);
      const currentPostDateObj = new Date(today);
      const timeDiff = currentPostDateObj.getTime() - lastPostDateObj.getTime();
      const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      if (dayDiff === 1) {
        newStreak++; // Increment streak
      } else if (dayDiff > 1) {
        newStreak = 1; // Reset streak
      }
    }

    // Update the profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ streak: newStreak, last_post_date: profile.last_post_date })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating streak:', error);
    } else {
      setProfile({ ...profile, streak: newStreak });
    }
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

              {/*IMAGES
              {posts.map((post) => (
                <div key={post.id}>
                <p>{post.content}</p>
                {post.image_url && <img src={post.image_url} alt="Post Image" />}
                </div>
                  ))}
                */}
              <p className={styles.postContent}>{post.content}</p>
              <div className={styles.postMeta}>
                <span className={styles.postAuthor}>
                  Posted by{' '}
                  {post.profile.avatar_url && (
                  <img src={post.profile.avatar_url} alt={profile.full_name} className={styles.avatar} />
                  )}
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
          
          {/*

          WORK ON THIS LATER
          {posts.length % offsetValue === 0 && (
            <button onClick={loadMorePosts} className={styles.loadMoreButton}>
            Load More
            </button>
          )}
          */}
        </div>
        
      ) : (
        <div className={styles.noPosts}>You must login to see posts.</div>
      )}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}