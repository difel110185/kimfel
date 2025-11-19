'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllTodos, updateTodo } from '@/lib/todoStore';
import { Todo, calculateTodoStatus } from '@/types/todo';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import styles from './page.module.css';

export default function ActiveTodosPage() {
  const { user, loading: authLoading } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchTodos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetchedTodos = await getAllTodos(user.uid);
      setTodos(fetchedTodos);
      setError(null);
    } catch (err) {
      setError('Failed to fetch todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTodo = async (todoId: string) => {
    if (!user) return;
    try {
      setCompletingId(todoId);
      const updatedTodo = await updateTodo(todoId, user.uid, { completed: true });
      if (updatedTodo) {
        setTodos(todos.map(todo => todo.id === todoId ? updatedTodo : todo));
        setExpandedId(null);
      }
    } catch (err) {
      setError('Failed to complete todo');
      console.error(err);
    } finally {
      setCompletingId(null);
    }
  };

  const toggleTodoExpanded = (todoId: string) => {
    setExpandedId(expandedId === todoId ? null : todoId);
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchTodos();
    } else if (!authLoading && !user) {
      setLoading(false);
      setTodos([]);
    }
  }, [user, authLoading]);

  // Filter included todos and sort by deadline ASC
  const includedTodos = useMemo(() => {
    return todos
      .filter(todo => todo.included) // Only included todos
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()); // Sort by deadline ASC
  }, [todos]);

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Show authentication prompt if user is not logged in
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.authPrompt}>
          <h2>Welcome to Active Todos</h2>
          <p>Please sign in with Google to view your active todos.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className={styles.loading}>Loading active todos...</div>;

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.closeError}>×</button>
        </div>
      )}

      {includedTodos.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No Active Todos</h3>
          <p>You don't have any active todos at the moment.</p>
          <Link href="/todos" className={styles.createLink}>
            Go to All Todos →
          </Link>
        </div>
      ) : (
        <div className={styles.todoList}>
          {includedTodos.map(todo => {
            const status = calculateTodoStatus(todo);
            const now = new Date();
            const deadline = new Date(todo.deadline);
            const isOverdue = deadline < now && !todo.completed;
            const isToday = deadline.toDateString() === now.toDateString() && !todo.completed;
            const isCompleted = todo.completed;
            const isExpanded = expandedId === todo.id;

            // Determine background class based on priority
            let colorClass = '';
            if (isCompleted) {
              colorClass = styles.completed;
            } else if (isOverdue) {
              colorClass = styles.overdue;
            } else if (isToday) {
              colorClass = styles.today;
            }

            return (
              <div
                key={todo.id}
                className={`${styles.todoCard} ${colorClass} ${isExpanded ? styles.expanded : ''}`}
              >
                <div
                  className={styles.todoHeader}
                  onClick={() => toggleTodoExpanded(todo.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleTodoExpanded(todo.id)}
                >
                  <div className={styles.todoTitleRow}>
                    <h3 className={styles.todoName}>{todo.name}</h3>
                    <div className={styles.headerRight}>
                      {(isOverdue || isToday) && (
                        <span className={styles.quickIndicator}>
                          {isOverdue ? '⏰' : '🎯'}
                        </span>
                      )}
                      <span className={styles.expandIcon}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.todoDetails}>
                    <div className={styles.statusRow}>
                      <span className={`${styles.statusBadge} ${styles[status]}`}>
                        {status === 'completed' ? '✅' : status === 'late' ? '⏰' : '📋'} {status}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.label}>Deadline:</span>
                      <span className={styles.value}>
                        {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.label}>Included At:</span>
                      <span className={styles.value}>
                        {new Date(todo.includedAt).toLocaleDateString()} at {new Date(todo.includedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {isOverdue && (
                      <div className={styles.overdueWarning}>
                        ⚠️ This todo is overdue
                      </div>
                    )}

                    {isToday && !isOverdue && (
                      <div className={styles.todayNotice}>
                        🎯 Due today
                      </div>
                    )}

                    {!todo.completed && (
                      <button
                        onClick={() => handleCompleteTodo(todo.id)}
                        disabled={completingId === todo.id}
                        className={styles.completeButton}
                      >
                        {completingId === todo.id ? '⏳ Completing...' : '✓ Mark as Complete'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
