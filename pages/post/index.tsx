import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../../daylee/lib/supabase';
import { useRouter } from 'next/router';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import styles from './Post.module.css';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function Post() {
  const [content, setContent] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [file, setFile] = useState<File | null>(null); // State for the selected file
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
        checkIfPostedToday(user.id);
      }
    }

    async function checkIfPostedToday(userId: string) {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('posts')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last post date:', error);
      } else if (data.length > 0) {
        const lastPostDate = new Date(data[0].created_at).toISOString().split('T')[0];
        setHasPostedToday(lastPostDate === today);
      }
    }

    fetchUser();
  }, [router]);

  const uploadImage = async (file: File) => {
    //check if its a size error
    console.log('Attempting to upload file:', file.name, 'Size:', file.size);

    // Check if file is too large (adjust the size limit as needed)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('File is too large. Max size is', MAX_FILE_SIZE, 'bytes');
      return null;
    }

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    console.log('Generated file name:', fileName);



    try {
      //400 post error here
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);
      //403 error here
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }
      console.log('Upload successful, data:', data);


      const { data: publicURLData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      console.log('Public URL data:', publicURLData);

      if (publicURLData && publicURLData.publicUrl) {
        console.log('Uploaded image URL:', publicURLData.publicUrl);
        return publicURLData.publicUrl;
      } else {
        console.error('Failed to get public URL');
        return null;
      }
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      return null;
    }
  };



  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let imageUrl = null;
    if (file) {
      imageUrl = await uploadImage(file);
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content, image_url: imageUrl }); // Include image_url

    if (error) {
      alert(error.message);
    } else {
      setContent('');
      setFile(null); // Reset file input
      alert('Post created!');
      router.push('/'); // Redirect to the main page
    }
  };

  return (
    <div className={styles.container}>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
      <h1 className={styles.title}>Create a New Post</h1>

      <div className={styles.imageContainer}>
        <Image
          src="https://rlkujunnwysipywrqbnk.supabase.co/storage/v1/object/public/UI%20images/elon_for_daylee.png"
          alt="Elon wants to know what you got done"
          width={550}
          height={300}
          className={styles.image}
        />
      </div>

      <form onSubmit={handlePost} className={styles.form}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className={styles.textarea}
          placeholder="What did you get done today?"
        />
        <div className={styles.fileInput}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className={styles.fileInput}
          />
        </div>
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.button}>Post</button>

          {hasPostedToday ? (
            <button type="button" className={styles.button} onClick={() => router.push('/')}>
              Home
            </button>
          ) : null}
        </div>
      </form>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}