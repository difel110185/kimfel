import { Timestamp } from 'firebase/firestore';

export type TodoStatus = 'pending' | 'completed' | 'late';

export interface Todo {
  id: string;
  name: string;
  completed: boolean;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Firestore version of Todo (with Firestore Timestamps)
export interface FirestoreTodo {
  name: string;
  completed: boolean;
  deadline: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}

export interface CreateTodoRequest {
  name: string;
  completed?: boolean;
  deadline: Date;
}

export interface UpdateTodoRequest {
  name?: string;
  completed?: boolean;
  deadline?: Date;
}

// Helper function to calculate status
export function calculateTodoStatus(todo: Todo): TodoStatus {
  if (todo.completed) {
    return 'completed';
  }

  const now = new Date();
  const deadline = new Date(todo.deadline);

  if (deadline < now) {
    return 'late';
  }

  return 'pending';
}
