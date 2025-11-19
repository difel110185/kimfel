import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.tilesContainer}>
          <Link href="/todos" className={styles.tile}>
            <div className={styles.tileIcon}>📋</div>
            <h2 className={styles.tileTitle}>All Todos</h2>
            <p className={styles.tileDescription}>
              View and manage all your tasks with full control over creation, editing, and organization.
            </p>
            <span className={styles.tileArrow}>→</span>
          </Link>

          <Link href="/active-todos" className={styles.tile}>
            <div className={styles.tileIcon}>🎯</div>
            <h2 className={styles.tileTitle}>Active Todos</h2>
            <p className={styles.tileDescription}>
              Focus on your active tasks sorted by deadline to prioritize what matters most.
            </p>
            <span className={styles.tileArrow}>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
