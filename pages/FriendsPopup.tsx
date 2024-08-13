import React, { useState, useEffect } from 'react';
import { supabase } from '../daylee/lib/supabase';
import styles from './Popup.module.css';

interface FriendsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Friend {
  id: number;
  full_name: string;
}

interface FriendRequest {
  id: number;
  user_id: string;
  friend_id: string;
  status: string;
  full_name: string;
}

const FriendsPopup: React.FC<FriendsPopupProps> = ({ isOpen, onClose }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [friendCount, setFriendCount] = useState<number>(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: userResponse, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      if (userResponse && userResponse.user) {
        setUserId(userResponse.user.id);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchFriends();
      fetchFriendRequests();
      fetchFriendCount();
    }
  }, [userId]);

  const fetchFriends = async () => {
    const { data, error } = await supabase
      .from('friends')
      .select('id, profiles!friend_id(full_name)')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friends:', error);
    } else {
      const formattedData = data.map((friend: any) => ({
        id: friend.id,
        full_name: friend.profiles.full_name,
      }));
      setFriends(formattedData || []);
    }
  };

  const fetchFriendRequests = async () => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        sender:profiles!user_id(full_name)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
  
    if (error) {
      console.error('Error fetching friend requests:', error);
    } else {
      const formattedData = data.map((request: any) => ({
        id: request.id,
        user_id: request.user_id,
        friend_id: request.friend_id,
        status: request.status,
        full_name: request.sender.full_name,
      }));
      setFriendRequests(formattedData || []);
    }
  };

  const fetchFriendCount = async () => {
    const { count, error } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friend count:', error);
    } else {
      setFriendCount(count || 0);
    }
  };

  const handleFriendRequest = async (requestId: number, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('friends')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.error(`Error ${status === 'accepted' ? 'accepting' : 'rejecting'} friend request:`, error);
    } else {
      fetchFriendRequests();
      if (status === 'accepted') {
        fetchFriends();
        setFriendCount(prevCount => prevCount + 1);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={`${styles.popupContent} ${styles.container}`}>
        <div className={styles.header}>
          <button onClick={onClose} className={styles.button}>
            Back to Home
          </button>
          <span className={styles.friendCount}>
            Friends: {friendCount}
          </span>
        </div>
        <h1 className={styles.title}>Friends List</h1>
        <ul className={styles.friendList}>
          {friends.map((friend) => (
            <li key={friend.id} className={styles.friendCard}>
              {friend.full_name}
            </li>
          ))}
        </ul>
        <h1 className={styles.title}>Friend Requests</h1>
        <ul className={styles.postList}>
          {friendRequests.map((request) => (
            <li key={request.id} className={styles.postCard}>
              <div className={styles.postContent}>
                Friend Request from: {request.full_name || "anonymous"}
              </div>
              <div className={styles.postMeta}>
                <button 
                  onClick={() => handleFriendRequest(request.id, 'accepted')}
                  className={styles.button}
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleFriendRequest(request.id, 'rejected')}
                  className={`${styles.button} ${styles.rejectButton}`}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
        {friendRequests.length === 0 && <p className={styles.noPosts}>No pending friend requests.</p>}
      </div>
    </div>
  );
};

export default FriendsPopup;
