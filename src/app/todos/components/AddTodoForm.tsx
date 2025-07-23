'use client';

import { useState } from 'react';
import styles from './TodoForm.module.css';

interface AddTodoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, deadline: Date) => Promise<void>;
}

export default function AddTodoForm({ isOpen, onClose, onSubmit }: AddTodoFormProps) {
  const [todoName, setTodoName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default deadline to tomorrow
  const getDefaultDeadline = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16); // Format for datetime-local input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoName.trim() || !deadline || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const deadlineDate = new Date(deadline);
      await onSubmit(todoName.trim(), deadlineDate);

      // Reset form and close modal
      setTodoName('');
      setDeadline('');
      onClose();
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTodoName('');
    setDeadline('');
    onClose();
  };

  // Set default deadline when modal opens
  if (isOpen && !deadline) {
    setDeadline(getDefaultDeadline());
  }

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add New Todo</h2>
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
            <label htmlFor="todoName" className={styles.label}>
              Todo Name *
            </label>
            <input
              id="todoName"
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
            <label htmlFor="deadline" className={styles.label}>
              Deadline *
            </label>
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={styles.input}
              required
              disabled={isSubmitting}
            />
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
              disabled={!todoName.trim() || !deadline || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Adding...
                </>
              ) : (
                '+ Add Todo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
