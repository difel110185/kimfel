/**
 * Todo API Test Examples
 *
 * This file shows example usage of the Todo API endpoints.
 * You can test these in tools like Postman, curl, or your frontend.
 */

// Example API calls:

// 1. Create a new todo
// POST /api/todos
// Body: { "name": "Buy groceries", "status": "pending" }

// 2. Get all todos
// GET /api/todos

// 3. Get a specific todo
// GET /api/todos?id=abc123

// 4. Update a todo
// PUT /api/todos?id=abc123
// Body: { "name": "Buy groceries and cook dinner", "status": "completed" }

// 5. Delete a todo
// DELETE /api/todos?id=abc123

export const exampleUsage = {
  createTodo: {
    method: 'POST',
    url: '/api/todos',
    body: {
      name: 'Complete project documentation',
      status: 'pending'
    }
  },

  getAllTodos: {
    method: 'GET',
    url: '/api/todos'
  },

  getTodoById: {
    method: 'GET',
    url: '/api/todos?id=abc123'
  },

  updateTodo: {
    method: 'PUT',
    url: '/api/todos?id=abc123',
    body: {
      status: 'completed'
    }
  },

  deleteTodo: {
    method: 'DELETE',
    url: '/api/todos?id=abc123'
  }
};

// Example fetch calls for frontend usage:

export const todoApiClient = {
  async createTodo(name: string, status?: 'pending' | 'completed' | 'late') {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status })
    });
    return response.json();
  },

  async getAllTodos() {
    const response = await fetch('/api/todos');
    return response.json();
  },

  async getTodoById(id: string) {
    const response = await fetch(`/api/todos?id=${id}`);
    return response.json();
  },

  async updateTodo(id: string, updates: { name?: string; status?: 'pending' | 'completed' | 'late' }) {
    const response = await fetch(`/api/todos?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  async deleteTodo(id: string) {
    const response = await fetch(`/api/todos?id=${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};
