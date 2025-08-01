'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { seedMockTodos } from '../scripts/seedMockTodos';
import styles from './SeedButton.module.css';

const SeedButton = () => {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!user) {
      setSeedResult('❌ Please sign in first');
      return;
    }

    try {
      setIsSeeding(true);
      setSeedResult(null);

      const results = await seedMockTodos(user.uid, 50);

      setSeedResult(`✅ Successfully created ${results.length} todos with random deadlines between 7 days ago and 7 days ahead!`);

      // Refresh the page after a short delay to show the new todos
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error seeding todos:', error);
      setSeedResult(`❌ Failed to seed todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!user) {
    return null; // Don't show the button if user is not signed in
  }

  return (
    <div className={styles.seedContainer}>
      <button
        onClick={handleSeed}
        disabled={isSeeding}
        className={styles.seedButton}
      >
        {isSeeding ? (
          <>
            <span className={styles.spinner}></span>
            Seeding 50 todos...
          </>
        ) : (
          '🌱 Seed 50 Sample Todos'
        )}
      </button>

      {seedResult && (
        <div className={`${styles.result} ${seedResult.startsWith('✅') ? styles.success : styles.error}`}>
          {seedResult}
        </div>
      )}
    </div>
  );
};

export default SeedButton;
