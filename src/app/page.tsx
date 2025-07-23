import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Welcome to Kimfel</h1>
          <p className={styles.subtitle}>
            Your personal productivity companion for managing tasks and staying organized.
          </p>
        </header>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <h3>📋 Todo Management</h3>
            <p>Create, edit, and organize your tasks with powerful filtering and sorting capabilities.</p>
            <Link href="/todos" className={styles.featureLink}>
              Go to Todos →
            </Link>
          </div>

          <div className={styles.featureCard}>
            <h3>🔍 Smart Filtering</h3>
            <p>Find exactly what you need with name-based search and status filtering.</p>
          </div>

          <div className={styles.featureCard}>
            <h3>📊 Pagination</h3>
            <p>Browse through your tasks efficiently with built-in pagination controls.</p>
          </div>
        </div>

        <div className={styles.cta}>
          <Link href="/todos" className={styles.ctaButton}>
            Get Started with Todos
          </Link>
        </div>
      </div>
    </main>
  );
}
