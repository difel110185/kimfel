import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Todo, FirestoreTodo } from '../types/todo';

const TODOS_COLLECTION = 'todos';

// Helper function to convert Firestore document to Todo
const firestoreToTodo = (id: string, data: FirestoreTodo): Todo => {
  const todo = {
    id,
    name: data.name,
    completed: data.completed,
    included: data.included,
    includedAt: data.includedAt.toDate(),
    deadline: data.deadline.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    userId: data.userId
  };

  return todo;
};

export const getAllTodos = async (userId: string): Promise<Todo[]> => {
  try {
    const todosQuery = query(
      collection(db, TODOS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(todosQuery);

    return querySnapshot.docs.map(doc =>
      firestoreToTodo(doc.id, doc.data() as FirestoreTodo)
    );
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw new Error('Failed to fetch todos');
  }
};

export const getTodoById = async (id: string, userId: string): Promise<Todo | null> => {
  try {
    const docRef = doc(db, TODOS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as FirestoreTodo;
      // Verify the todo belongs to the user
      if (data.userId !== userId) {
        return null;
      }
      return firestoreToTodo(docSnap.id, data);
    }

    return null;
  } catch (error) {
    console.error('Error fetching todo:', error);
    throw new Error('Failed to fetch todo');
  }
};

export const createTodo = async (name: string, deadline: Date, userId?: string, completed: boolean = false, included: boolean = true, includedAt?: Date): Promise<Todo> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to create a todo');
    }

    const newTodo = {
      name,
      completed,
      included,
      includedAt: Timestamp.fromDate(includedAt || new Date()),
      deadline: Timestamp.fromDate(deadline),
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, TODOS_COLLECTION), newTodo);

    // Fetch the created document to return it with proper timestamps
    const createdTodo = await getTodoById(docRef.id, userId);
    if (!createdTodo) {
      throw new Error('Failed to retrieve created todo');
    }

    return createdTodo;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw new Error('Failed to create todo');
  }
};

export const updateTodo = async (id: string, userId: string, updates: { name?: string; completed?: boolean; included?: boolean; includedAt?: Date; deadline?: Date }): Promise<Todo | null> => {
  try {
    const docRef = doc(db, TODOS_COLLECTION, id);

    // Check if document exists and belongs to user
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as FirestoreTodo;
    if (data.userId !== userId) {
      return null;
    }

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.completed !== undefined) {
      updateData.completed = updates.completed;
    }
    if (updates.included !== undefined) {
      updateData.included = updates.included;
    }
    if (updates.includedAt !== undefined) {
      updateData.includedAt = Timestamp.fromDate(updates.includedAt);
    }
    if (updates.deadline !== undefined) {
      updateData.deadline = Timestamp.fromDate(updates.deadline);
    }

    await updateDoc(docRef, updateData);

    // Return updated todo
    return getTodoById(id, userId);
  } catch (error) {
    console.error('Error updating todo:', error);
    throw new Error('Failed to update todo');
  }
};

export const deleteTodo = async (id: string, userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, TODOS_COLLECTION, id);

    // Check if document exists and belongs to user
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return false;
    }

    const data = docSnap.data() as FirestoreTodo;
    if (data.userId !== userId) {
      return false;
    }

    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw new Error('Failed to delete todo');
  }
};
