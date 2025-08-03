'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <header className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>Todo App</h1>
          <div className={styles.loading}>Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>Todo App</h1>

        {user ? (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              {user.photoURL && (
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  width={32}
                  height={32}
                  className={styles.avatar}
                />
              )}
              <span className={styles.userName}>
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={signOut}
              className={styles.signOutButton}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className={styles.signInButton}
          >
            Sign In with Google
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
