'use client';

import { useState, useEffect } from 'react';
import { Todo, calculateTodoStatus } from '../../../types/todo';
import styles from './TodoForm.module.css';

interface EditTodoFormProps {
  isOpen: boolean;
  todo: Todo | null;
  onClose: () => void;
  onSubmit: (id: string, name: string, deadline: Date) => Promise<void>;
}

export default function EditTodoForm({ isOpen, todo, onClose, onSubmit }: EditTodoFormProps) {
  const [todoName, setTodoName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when todo changes
  useEffect(() => {
    if (todo) {
      setTodoName(todo.name);
      setDeadline(new Date(todo.deadline).toISOString().slice(0, 16));
      setHasChanges(false);
    }
  }, [todo]);

  // Track changes
  useEffect(() => {
    if (todo) {
      const nameChanged = todoName !== todo.name;
      const deadlineChanged = new Date(deadline).getTime() !== new Date(todo.deadline).getTime();
      setHasChanges(nameChanged || deadlineChanged);
    }
  }, [todoName, deadline, todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo || !todoName.trim() || !deadline || isSubmitting || !hasChanges) return;

    try {
      setIsSubmitting(true);
      const deadlineDate = new Date(deadline);
      await onSubmit(todo.id, todoName.trim(), deadlineDate);

      // Close modal (parent will reset form)
      onClose();
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTodoName('');
    setDeadline('');
    setHasChanges(false);
    onClose();
  };

  if (!isOpen || !todo) return null;

  const currentStatus = calculateTodoStatus(todo);
  const previewStatus = calculateTodoStatus({
    ...todo,
    completed: todo.completed,
    deadline: new Date(deadline)
  });

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit Todo</h2>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeButton}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="editTodoName" className={styles.label}>
              Todo Name *
            </label>
            <input
              id="editTodoName"
              type="text"
              placeholder="Enter todo name..."
              value={todoName}
              onChange={(e) => setTodoName(e.target.value)}
              className={styles.input}
              required
              autoFocus
              disabled={isSubmitting}
              maxLength={255}
            />
            <div className={styles.charCount}>
              {todoName.length}/255 characters
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editDeadline" className={styles.label}>
              Deadline *
            </label>
            <input
              id="editDeadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={styles.input}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.statusPreview}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Current Status:</span>
              <span className={`${styles.statusValue} ${styles[currentStatus]}`}>
                {currentStatus === 'completed' ? '✅' : currentStatus === 'late' ? '⏰' : '📋'} {currentStatus}
              </span>
            </div>
            {hasChanges && (
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>New Status:</span>
                <span className={`${styles.statusValue} ${styles[previewStatus]}`}>
                  {previewStatus === 'completed' ? '✅' : previewStatus === 'late' ? '⏰' : '📋'} {previewStatus}
                </span>
              </div>
            )}
          </div>

          <div className={styles.todoInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Created:</span>
              <span className={styles.infoValue}>
                {new Date(todo.createdAt).toLocaleString()}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Last Updated:</span>
              <span className={styles.infoValue}>
                {new Date(todo.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!todoName.trim() || !deadline || isSubmitting || !hasChanges}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Saving...
                </>
              ) : hasChanges ? (
                '💾 Save Changes'
              ) : (
                'No Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
