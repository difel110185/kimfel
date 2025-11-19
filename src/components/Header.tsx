'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';
import {useAuth} from "@/contexts/AuthContext";

const Header: React.FC = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.titleLink}>
            <h1 className={styles.title}>Todo App</h1>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.titleLink}>
          <h1 className={styles.title}>Todo App</h1>
        </Link>

        {user ? (
          <div className={styles.userSection}>
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
