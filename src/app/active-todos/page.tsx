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
  const [excludingId, setExcludingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to recalculate remaining time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval);
  }, []);

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

  const handleToggleComplete = async (todoId: string, currentCompleted: boolean) => {
    if (!user) return;
    try {
      setCompletingId(todoId);
      const updatedTodo = await updateTodo(todoId, user.uid, { completed: !currentCompleted });
      if (updatedTodo) {
        setTodos(todos.map(todo => todo.id === todoId ? updatedTodo : todo));
        setExpandedId(null);
      }
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
    } finally {
      setCompletingId(null);
    }
  };

  const handleExcludeTodo = async (todoId: string) => {
    if (!user) return;
    try {
      setExcludingId(todoId);
      const updatedTodo = await updateTodo(todoId, user.uid, { included: false });
      if (updatedTodo) {
        setTodos(todos.map(todo => todo.id === todoId ? updatedTodo : todo));
        setExpandedId(null);
      }
    } catch (err) {
      setError('Failed to exclude todo');
      console.error(err);
    } finally {
      setExcludingId(null);
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
            const now = currentTime;
            const deadline = new Date(todo.deadline);
            const isOverdue = deadline < now && !todo.completed;
            const isToday = deadline.toDateString() === now.toDateString() && !todo.completed;
            const isCompleted = todo.completed;
            const isExpanded = expandedId === todo.id;

            // Calculate remaining time
            const timeDiff = deadline.getTime() - now.getTime();
            const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            let timeRemainingText = '';
            if (isOverdue) {
              const daysOverdue = Math.abs(daysRemaining);
              const hoursOverdue = Math.abs(hoursRemaining);
              if (daysOverdue > 0) {
                timeRemainingText = `${daysOverdue}d overdue`;
              } else if (hoursOverdue > 0) {
                timeRemainingText = `${hoursOverdue}h overdue`;
              } else {
                timeRemainingText = `${Math.abs(minutesRemaining)}m overdue`;
              }
            } else if (isCompleted) {
              timeRemainingText = 'Completed';
            } else {
              if (daysRemaining > 0) {
                timeRemainingText = `${daysRemaining}d ${hoursRemaining}h`;
              } else if (hoursRemaining > 0) {
                timeRemainingText = `${hoursRemaining}h ${minutesRemaining}m`;
              } else if (minutesRemaining > 0) {
                timeRemainingText = `${minutesRemaining}m`;
              } else {
                timeRemainingText = 'Due now';
              }
            }

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
                      <span className={styles.timeRemaining}>
                        {timeRemainingText}
                      </span>
                      <span className={styles.expandIcon}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.todoDetails}>
                    <button
                      onClick={() => handleToggleComplete(todo.id, todo.completed)}
                      disabled={completingId === todo.id}
                      className={todo.completed ? styles.undoButton : styles.completeButton}
                    >
                      {completingId === todo.id
                        ? '⏳ Updating...'
                        : todo.completed
                          ? '↶ Mark as Incomplete'
                          : '✓ Mark as Complete'}
                    </button>

                    <button
                      onClick={() => handleExcludeTodo(todo.id)}
                      disabled={excludingId === todo.id}
                      className={styles.excludeButton}
                    >
                      {excludingId === todo.id ? '⏳ Excluding...' : '⚫ Exclude from Active'}
                    </button>
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
