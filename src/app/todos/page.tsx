'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllTodos, createTodo, updateTodo, deleteTodo } from '../../lib/todoStore';
import { Todo, TodoStatus, calculateTodoStatus } from '../../types/todo';
import AddTodoForm from './components/AddTodoForm';
import EditTodoForm from './components/EditTodoForm';
import styles from './page.module.css';

type SortField = 'name' | 'deadline' | 'completed' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'all'>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const fetchedTodos = await getAllTodos();
      setTodos(fetchedTodos);
    } catch (err) {
      setError('Failed to fetch todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort todos with calculated status
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todos.filter(todo => {
      const matchesName = todo.name.toLowerCase().includes(nameFilter.toLowerCase());
      const calculatedStatus = calculateTodoStatus(todo);
      const matchesStatus = statusFilter === 'all' || calculatedStatus === statusFilter;
      return matchesName && matchesStatus;
    });

    // Sort todos
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'completed') {
        aValue = a.completed ? 1 : 0;
        bValue = b.completed ? 1 : 0;
      } else if (sortField === 'deadline' || sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(a[sortField]).getTime();
        bValue = new Date(b[sortField]).getTime();
      } else {
        aValue = a[sortField].toString().toLowerCase();
        bValue = b[sortField].toString().toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [todos, nameFilter, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTodos.length / itemsPerPage);
  const paginatedTodos = filteredAndSortedTodos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddTodo = async (name: string, deadline: Date) => {
    try {
      await createTodo(name, deadline, false); // Default completed to false
      await fetchTodos();
    } catch (err) {
      setError('Failed to create todo');
      throw err;
    }
  };

  const handleEditTodo = async (id: string, name: string, deadline: Date) => {
    try {
      await updateTodo(id, { name, deadline });
      await fetchTodos();
    } catch (err) {
      setError('Failed to update todo');
      throw err;
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      await deleteTodo(id);
      await fetchTodos();
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const handleCompleteTodo = async (id: string, currentCompleted: boolean) => {
    try {
      // Optimistically update the UI first
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id
            ? { ...todo, completed: !currentCompleted, updatedAt: new Date() }
            : todo
        )
      );

      // Then update the database
      await updateTodo(id, { completed: !currentCompleted });

      // If the database update fails, the error will be caught and we can revert
      // But for now, we trust the update succeeded since we did optimistic update
    } catch (err) {
      setError('Failed to update todo');
      // Revert the optimistic update by re-fetching from database
      await fetchTodos();
    }
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTodo(null);
  };

  const resetFilters = () => {
    setNameFilter('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  if (loading) return <div className={styles.loading}>Loading todos...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Todo Management</h1>
        <p>Manage your todos with filtering, sorting, and pagination</p>
      </header>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.closeError}>×</button>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Filter by name..."
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterInput}
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TodoStatus | 'all');
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            <option value="pending">📋 Pending</option>
            <option value="completed">✅ Completed</option>
            <option value="late">⏰ Late</option>
          </select>

          <button onClick={resetFilters} className={styles.resetButton}>
            Reset Filters
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={styles.addButton}
        >
          + Add Todo
        </button>
      </div>

      <div className={styles.stats}>
        Showing {paginatedTodos.length} of {filteredAndSortedTodos.length} todos
        {filteredAndSortedTodos.length !== todos.length && ` (filtered from ${todos.length} total)`}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Status</th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort('deadline')}
              >
                Deadline {sortField === 'deadline' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTodos.map(todo => {
              const status = calculateTodoStatus(todo);
              return (
                <tr key={todo.id}>
                  <td className={styles.nameCell}>{todo.name}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[status]}`}>
                      {status === 'completed' ? '✅' : status === 'late' ? '⏰' : '📋'} {status}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(todo.deadline).toLocaleString()}
                  </td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => handleCompleteTodo(todo.id, todo.completed)}
                      className={todo.completed ? styles.undoButton : styles.completeButton}
                      title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {todo.completed ? '↶ Undo' : '✓ Complete'}
                    </button>
                    <button
                      onClick={() => openEditModal(todo)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {paginatedTodos.length === 0 && (
          <div className={styles.emptyState}>
            {filteredAndSortedTodos.length === 0 ?
              'No todos match your filters' :
              'No todos found'
            }
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Previous
          </button>

          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Last
          </button>
        </div>
      )}

      {/* Form Components */}
      <AddTodoForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTodo}
      />

      <EditTodoForm
        isOpen={showEditModal}
        todo={editingTodo}
        onClose={closeEditModal}
        onSubmit={handleEditTodo}
      />
    </div>
  );
}
