import { createTodo } from '../lib/todoStore';
import { TodoStatus } from '../types/todo';

const mockTodoNames = [
  'Buy groceries for the week',
  'Schedule dentist appointment',
  'Complete project proposal',
  'Call mom and dad',
  'Fix leaky faucet in kitchen',
  'Review quarterly budget',
  'Plan weekend hiking trip',
  'Update resume and LinkedIn profile',
  'Organize home office desk',
  'Book flight tickets for vacation',
  'Learn new programming language',
  'Write blog post about React',
  'Clean out email inbox',
  'Exercise for 30 minutes',
  'Read chapter 5 of book',
  'Pay monthly bills online',
  'Backup important files',
  'Schedule car maintenance',
  'Practice guitar for an hour',
  'Meal prep for next week',
  'Submit tax documents',
  'Research new investment options',
  'Update software on all devices',
  'Plan birthday party for friend',
  'Deep clean the bathroom',
  'Organize photo collection',
  'Learn basic Spanish phrases',
  'Set up home security system',
  'Create workout schedule',
  'Write thank you notes',
  'Research vacation destinations',
  'Update insurance policies',
  'Organize closet and donate clothes',
  'Setup automatic bill payments',
  'Plan healthy meal recipes',
  'Create emergency contact list',
  'Research new job opportunities',
  'Setup morning routine',
  'Learn to make homemade bread',
  'Update social media profiles',
  'Plan garden for spring planting',
  'Research home improvement projects',
  'Create budget for home renovations',
  'Setup investment portfolio',
  'Learn photography basics',
  'Plan date night activities',
  'Research new hobbies to try',
  'Create vision board for goals',
  'Setup automated savings plan',
  'Plan family reunion activities'
];

const statuses: TodoStatus[] = ['pending', 'completed', 'late'];

export async function seedMockTodos() {
  console.log('Starting to seed mock todos...');

  try {
    const promises = mockTodoNames.map((name, index) => {
      // Distribute statuses evenly across all todos
      const statusIndex = index % statuses.length;
      const status = statuses[statusIndex];

      return createTodo(name, status);
    });

    const results = await Promise.all(promises);

    console.log(`Successfully created ${results.length} mock todos!`);
    console.log('Status distribution:');

    const statusCounts = results.reduce((counts, todo) => {
      counts[todo.status] = (counts[todo.status] || 0) + 1;
      return counts;
    }, {} as Record<TodoStatus, number>);

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} items`);
    });

    return results;
  } catch (error) {
    console.error('Error seeding todos:', error);
    throw error;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  seedMockTodos()
    .then(() => {
      console.log('Mock data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed mock data:', error);
      process.exit(1);
    });
}
