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
    deadline: data.deadline.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  };

  return todo;
};

export const getAllTodos = async (): Promise<Todo[]> => {
  try {
    const todosQuery = query(
      collection(db, TODOS_COLLECTION),
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

export const getTodoById = async (id: string): Promise<Todo | null> => {
  try {
    const docRef = doc(db, TODOS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return firestoreToTodo(docSnap.id, docSnap.data() as FirestoreTodo);
    }

    return null;
  } catch (error) {
    console.error('Error fetching todo:', error);
    throw new Error('Failed to fetch todo');
  }
};

export const createTodo = async (name: string, deadline: Date, completed: boolean = false): Promise<Todo> => {
  try {
    const newTodo = {
      name,
      completed,
      deadline: Timestamp.fromDate(deadline),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, TODOS_COLLECTION), newTodo);

    // Fetch the created document to return it with proper timestamps
    const createdTodo = await getTodoById(docRef.id);
    if (!createdTodo) {
      throw new Error('Failed to retrieve created todo');
    }

    return createdTodo;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw new Error('Failed to create todo');
  }
};

export const updateTodo = async (id: string, updates: { name?: string; completed?: boolean; deadline?: Date }): Promise<Todo | null> => {
  try {
    const docRef = doc(db, TODOS_COLLECTION, id);

    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
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
    if (updates.deadline !== undefined) {
      updateData.deadline = Timestamp.fromDate(updates.deadline);
    }

    await updateDoc(docRef, updateData);

    // Return the updated document
    return await getTodoById(id);
  } catch (error) {
    console.error('Error updating todo:', error);
    throw new Error('Failed to update todo');
  }
};

export const deleteTodo = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, TODOS_COLLECTION, id);

    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return false;
    }

    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw new Error('Failed to delete todo');
  }
};
