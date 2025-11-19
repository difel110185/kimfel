'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllTodos, createTodo, updateTodo, deleteTodo } from '@/lib/todoStore';
import { Todo, TodoStatus, calculateTodoStatus } from '@/types/todo';
import { useAuth } from '@/contexts/AuthContext';
import AddTodoForm from './components/AddTodoForm';
import EditTodoForm from './components/EditTodoForm';
import SeedButton from '../../components/SeedButton';
import styles from './page.module.css';

type SortField = 'name' | 'deadline' | 'completed' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function TodosPage() {
  const { user, loading: authLoading } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'all'>('all');
  const [includedFilter, setIncludedFilter] = useState<'all' | 'included' | 'excluded'>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Accordion
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

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

  useEffect(() => {
    if (!authLoading && user) {
      fetchTodos();
    } else if (!authLoading && !user) {
      setLoading(false);
      setTodos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Filter and sort todos with calculated status - MOVED BEFORE EARLY RETURNS
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todos.filter(todo => {
      const matchesName = todo.name.toLowerCase().includes(nameFilter.toLowerCase());
      const calculatedStatus = calculateTodoStatus(todo);
      const matchesStatus = statusFilter === 'all' || calculatedStatus === statusFilter;
      const matchesIncluded = includedFilter === 'all' ||
        (includedFilter === 'included' && todo.included) ||
        (includedFilter === 'excluded' && !todo.included);
      return matchesName && matchesStatus && matchesIncluded;
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
  }, [todos, nameFilter, statusFilter, includedFilter, sortField, sortDirection]);

  // Pagination - MOVED BEFORE EARLY RETURNS
  const totalPages = Math.ceil(filteredAndSortedTodos.length / itemsPerPage);
  const paginatedTodos = filteredAndSortedTodos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ALL FUNCTION DEFINITIONS - MOVED BEFORE EARLY RETURNS
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
      await createTodo(name, deadline, user?.uid, false, true, new Date());
      await fetchTodos();
    } catch (err) {
      setError('Failed to create todo');
      throw err;
    }
  };

  const handleEditTodo = async (id: string, name: string, deadline: Date) => {
    if (!user) return;
    try {
      await updateTodo(id, user.uid, { name, deadline });
      await fetchTodos();
    } catch (err) {
      setError('Failed to update todo');
      throw err;
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      await deleteTodo(id, user.uid);
      await fetchTodos();
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const handleCompleteTodo = async (id: string, currentCompleted: boolean) => {
    if (!user) return;
    try {
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id
            ? { ...todo, completed: !currentCompleted, updatedAt: new Date() }
            : todo
        )
      );

      await updateTodo(id, user.uid, { completed: !currentCompleted });
    } catch (err) {
      setError('Failed to update todo');
      await fetchTodos();
    }
  };

  const handleToggleIncluded = async (id: string, currentIncluded: boolean) => {
    if (!user) return;
    try {
      const now = new Date();
      const newIncluded = !currentIncluded;

      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id
            ? {
                ...todo,
                included: newIncluded,
                includedAt: newIncluded ? now : todo.includedAt,
                updatedAt: now
              }
            : todo
        )
      );

      const updates: { included: boolean; includedAt?: Date } = { included: newIncluded };
      if (newIncluded) {
        updates.includedAt = now;
      }

      await updateTodo(id, user.uid, updates);
    } catch (err) {
      setError('Failed to update todo');
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
    setIncludedFilter('all');
    setCurrentPage(1);
  };

  // NOW SAFE TO HAVE EARLY RETURNS AFTER ALL HOOKS ARE DECLARED
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
          <h2>Welcome to Todo App</h2>
          <p>Please sign in with Google to manage your todos.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className={styles.loading}>Loading todos...</div>;

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.closeError}>×</button>
        </div>
      )}

      {/* Add seed button if user has no todos or very few todos */}
      {todos.length === 0 && <SeedButton />}

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

          <select
            value={includedFilter}
            onChange={(e) => {
              setIncludedFilter(e.target.value as 'all' | 'included' | 'excluded');
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="all">Included and Excluded</option>
            <option value="included">🟢 Included Only</option>
            <option value="excluded">⚫ Excluded Only</option>
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
              const isExpanded = expandedRowId === todo.id;
              return (
                <>
                  <tr key={todo.id} className={!todo.included ? styles.inactiveRow : ''}>
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
                        onClick={() => setExpandedRowId(isExpanded ? null : todo.id)}
                        className={styles.viewButton}
                        title="View all details"
                      >
                        {isExpanded ? '▼ Hide' : '▶ View'}
                      </button>
                      <button
                        onClick={() => handleCompleteTodo(todo.id, todo.completed)}
                        className={todo.completed ? styles.undoButton : styles.completeButton}
                        title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {todo.completed ? '↶ Undo' : '✓ Complete'}
                      </button>
                      <button
                        onClick={() => handleToggleIncluded(todo.id, todo.included)}
                        className={todo.included ? styles.excludeButton : styles.includeButton}
                        title={todo.included ? 'Exclude from active' : 'Include in active'}
                      >
                        {todo.included ? '⚫ Exclude' : '🟢 Include'}
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
                  {isExpanded && (
                    <tr key={`${todo.id}-details`} className={styles.expandedRow}>
                      <td colSpan={4} className={styles.expandedCell}>
                        <div className={styles.detailsContainer}>
                          <h3 className={styles.detailsTitle}>Todo Details</h3>
                          <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>ID:</span>
                              <span className={styles.detailValue}>{todo.id}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Name:</span>
                              <span className={styles.detailValue}>{todo.name}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Status:</span>
                              <span className={styles.detailValue}>
                                <span className={`${styles.statusBadge} ${styles[status]}`}>
                                  {status === 'completed' ? '✅' : status === 'late' ? '⏰' : '📋'} {status}
                                </span>
                              </span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Completed:</span>
                              <span className={styles.detailValue}>{todo.completed ? '✅ Yes' : '❌ No'}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Included:</span>
                              <span className={styles.detailValue}>{todo.included ? '🟢 Yes' : '⚫ No'}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Deadline:</span>
                              <span className={styles.detailValue}>{new Date(todo.deadline).toLocaleString()}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Included At:</span>
                              <span className={styles.detailValue}>{new Date(todo.includedAt).toLocaleString()}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Created At:</span>
                              <span className={styles.detailValue}>{new Date(todo.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Updated At:</span>
                              <span className={styles.detailValue}>{new Date(todo.updatedAt).toLocaleString()}</span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>User ID:</span>
                              <span className={styles.detailValue}>{todo.userId}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
