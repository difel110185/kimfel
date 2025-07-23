import type { NextApiRequest, NextApiResponse } from 'next';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../types/todo';
import {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo
} from '../../lib/todoStore';

type ApiResponse = Todo | Todo[] | { message: string } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/todos - Get all todos
// GET /api/todos?id=123 - Get specific todo by id
async function handleGet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id } = req.query;

  if (id && typeof id === 'string') {
    const todo = await getTodoById(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    return res.status(200).json(todo);
  }

  const todos = await getAllTodos();
  return res.status(200).json(todos);
}

// POST /api/todos - Create a new todo
async function handlePost(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { name, status = 'pending' }: CreateTodoRequest = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
  }

  if (status && !['pending', 'completed', 'late'].includes(status)) {
    return res.status(400).json({ error: 'Status must be one of: pending, completed, late' });
  }

  const newTodo = await createTodo(name.trim(), status);
  return res.status(201).json(newTodo);
}

// PUT /api/todos?id=123 - Update an existing todo
async function handlePut(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id } = req.query;
  const updates: UpdateTodoRequest = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Todo ID is required in query parameters' });
  }

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'At least one field to update is required' });
  }

  if (updates.name !== undefined && (typeof updates.name !== 'string' || updates.name.trim() === '')) {
    return res.status(400).json({ error: 'Name must be a non-empty string' });
  }

  if (updates.status && !['pending', 'completed', 'late'].includes(updates.status)) {
    return res.status(400).json({ error: 'Status must be one of: pending, completed, late' });
  }

  // Trim name if provided
  const cleanUpdates = {
    ...updates,
    ...(updates.name && { name: updates.name.trim() })
  };

  const updatedTodo = await updateTodo(id, cleanUpdates);

  if (!updatedTodo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  return res.status(200).json(updatedTodo);
}

// DELETE /api/todos?id=123 - Delete a todo
async function handleDelete(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Todo ID is required in query parameters' });
  }

  const deleted = await deleteTodo(id);

  if (!deleted) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  return res.status(200).json({ message: 'Todo deleted successfully' });
}
