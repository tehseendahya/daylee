import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../daylee/lib/supabase';
import styles from './Home.module.css';
import { Analytics } from "@vercel/analytics/react"; // Importing Analytics
import { SpeedInsights } from "@vercel/speed-insights/next"; // Importing SpeedInsights
import Image from 'next/image';
import FriendsPopup from './FriendsPopup';

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
  image_url: string;
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
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastPostDate = profile.last_post_date ? new Date(profile.last_post_date) : null;

    let newStreak = profile.streak;

    if (lastPostDate === null) {
        newStreak = 1; // First post ever
    } else {
        const lastPostDay = lastPostDate.toISOString().split('T')[0];
        const timeDiff = now.getTime() - lastPostDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

        if (today === lastPostDay) {
            // Post on the same day, streak remains unchanged
        } else if (dayDiff === 1) {
            newStreak++; // Increment streak for consecutive day post
        } else {
            // Check if it's just after midnight
            if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
                // It's exactly midnight, maintain streak if there was a post yesterday
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const yesterdayString = yesterday.toISOString().split('T')[0];
                if (lastPostDay !== yesterdayString) {
                    newStreak = 0; // Reset streak to 0 if no post yesterday
                }
            } else {
                newStreak = 1; // New streak starts for a new post after a gap
            }
        }
    }

    // Prepare the update data
    const updateData = { 
        streak: newStreak, 
        last_post_date: now.toISOString() 
    };

    // Update the profile in Supabase
    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

    if (error) {
        console.error('Error updating streak:', error);
    } else {
        setProfile({ ...profile, ...updateData });
    }

    return profile;
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
        <title>
          Welcome to Daylee!
        </title>
        {profile ? (
          <>
            <span className={styles.greeting}>Hello, {profile.full_name}</span>
            <span className={styles.streak}>Streak: {profile.streak}</span>
            <button onClick={handleSignOut} className={styles.button}>
              Sign Out
            </button>
            
            <button className={styles.button} onClick={() => setIsPopupOpen(true)}>Manage Friends</button>
      <FriendsPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
      
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
      <FriendsPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
      {isLoading ? (
        <div className={styles.loading}>Loading posts...</div>
      ) : posts.length > 0 ? (
        <div className={styles.postList}>
          {posts.map((post) => (

            <div key={post.id} className={styles.postCard}>

              {post.image_url && (
                <div className={styles.imageWrapper}>
                  <Image
                    src={post.image_url}
                    alt="Post Image"
                    layout="responsive"
                    width={16} // Example aspect ratio width
                    height={9} // Example aspect ratio height
                    className={styles.image}
                  />
                </div>
              )}
              <p className={styles.postContent}>{post.content}</p>
              <div className={styles.postMeta}>
                <span className={styles.postAuthor}>
                  Posted by{' '}
                  {post.profile.avatar_url && (
                    <img src={post.profile.avatar_url} alt={""} className={styles.avatar} />
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
        <div className={styles.noPosts}>Loading...</div>
      )}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}