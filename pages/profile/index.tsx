import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../daylee/lib/supabase';
import styles from './Profiles.module.css';
import React from 'react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  twitter_handle: string | null;
  current_work: string | null;
  avatar_url: string | null;
  streak: number;
  last_post_date: string | null;
}

interface Post {
  id: number;
  content: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [fullName, setFullName] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [currentWork, setCurrentWork] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      fetchProfile();
    }
  }, [router.isReady]);

  async function fetchProfile() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error fetching user:', userError);
      setError('Failed to authenticate user');
      setIsLoading(false);
      return;
    }

    let profileId = id as string;

    if (id === 'me' || !id) {
      if (!user) {
        router.push('/login');
        return;
      }
      profileId = user.id;
      setIsOwnProfile(true);
    } else {
      setIsOwnProfile(user?.id === profileId);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      if (error.code === 'PGRST116' || error.code === "404") {
        setShowPopup(true);
      } else {
        setError('Failed to load profile');
      }
    } else if (data) {
      setProfile(data);
      setFullName(data.full_name);
      setTwitterHandle(data.twitter_handle || '');
      setCurrentWork(data.current_work || '');
      await fetchUserPosts(profileId);
    }

    setIsLoading(false);
  }

  async function fetchUserPosts(userId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
    } else if (data) {
      setPosts(data);
    }
  }

  async function updateProfile() {
    if (!profile) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        twitter_handle: twitterHandle,
        current_work: currentWork,
      })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } else {
      setError(null);
      alert('Profile updated successfully!');
      fetchProfile(); // Refresh profile data
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (showPopup) {
    return (
      <div className={styles.popup}>
        <p>Public profile functionality coming soon</p>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          Back to Home
        </button>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!profile) {
    return <div className={styles.error}>Profile not found</div>;
  }

  return (
    <div className={styles.container}>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
      <h1 className={styles.title}>{profile.full_name}'s Profile</h1>
      <div className={styles.profileInfo}>
        {profile.avatar_url && (
          <img src={profile.avatar_url} alt={profile.full_name} className={styles.avatar} />
        )}
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Streak:</strong> {profile.streak} days</p>
        {isOwnProfile ? (
          <form onSubmit={(e) => { e.preventDefault(); updateProfile(); }} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="full_name">Full Name:</label>
              <input
                type="text"
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="twitter">Twitter Handle:</label>
              <input
                type="text"
                id="twitter"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@username"
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="work">What are you working on?</label>
              <textarea
                id="work"
                value={currentWork}
                onChange={(e) => setCurrentWork(e.target.value)}
                placeholder="I'm currently working on..."
                className={styles.textarea}
              />
            </div>
            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        ) : (
          <>
            {profile.twitter_handle && (
              <p><strong>Twitter:</strong> <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer">@{profile.twitter_handle}</a></p>
            )}
            {profile.current_work && (
              <p><strong>Currently working on:</strong> {profile.current_work}</p>
            )}
          </>
        )}
      </div>
      <h2 className={styles.subtitle}>Recent Posts</h2>
      <div className={styles.postList}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <p className={styles.postContent}>{post.content}</p>
              <span className={styles.postDate}>
                Posted on {new Date(post.created_at).toLocaleString()}
              </span>
            </div>
          ))
        ) : (
          <p>No posts yet.</p>
        )}
      </div>
      <button onClick={() => router.push('/')} className={styles.backButton}>
        Back to Home
      </button>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
