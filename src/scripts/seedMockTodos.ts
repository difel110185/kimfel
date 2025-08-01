import { createTodo } from '../lib/todoStore';

const todoNames = [
  'Complete project proposal',
  'Review quarterly reports',
  'Schedule team meeting',
  'Update website content',
  'Prepare presentation slides',
  'Review code changes',
  'Test new features',
  'Write documentation',
  'Fix bug reports',
  'Plan sprint activities',
  'Conduct user interviews',
  'Analyze performance metrics',
  'Update security protocols',
  'Backup important files',
  'Clean up workspace',
  'Order office supplies',
  'Schedule dental appointment',
  'Pay monthly bills',
  'Plan weekend activities',
  'Call family members',
  'Exercise routine',
  'Grocery shopping',
  'Read industry articles',
  'Learn new programming language',
  'Update LinkedIn profile',
  'Organize digital photos',
  'Plan vacation itinerary',
  'Research new technologies',
  'Practice presentation skills',
  'Network with colleagues',
  'Update resume',
  'Plan career goals',
  'Organize personal finances',
  'Deep clean house',
  'Maintain car service',
  'Plan healthy meals',
  'Set up home office',
  'Learn new hobby',
  'Volunteer for charity',
  'Plan birthday party',
  'Book travel reservations',
  'Study for certification',
  'Attend webinar',
  'Update software',
  'Create backup strategy',
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

export async function seedMockTodos(userId: string, count: number = 50) {
  if (!userId) {
    throw new Error('User ID is required to seed todos');
  }

  console.log(`Starting to seed ${count} mock todos for user ${userId}...`);

  try {
    const promises = Array.from({ length: Math.min(count, todoNames.length) }, (_, index) => {
      const name = todoNames[index % todoNames.length];

      // Generate random deadline between 7 days ago and 7 days ahead
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const sevenDaysAhead = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      // Random time between the two dates
      const randomTime = sevenDaysAgo.getTime() + Math.random() * (sevenDaysAhead.getTime() - sevenDaysAgo.getTime());
      const randomDeadline = new Date(randomTime);

      // Random completion status (30% chance of being completed)
      const completed = Math.random() < 0.3;

      return createTodo(name, randomDeadline, userId, completed);
    });

    const results = await Promise.all(promises);

    console.log(`Successfully created ${results.length} mock todos!`);

    // Log some statistics
    const completedCount = results.filter(todo => todo.completed).length;
    const pendingCount = results.length - completedCount;

    console.log(`📊 Statistics:`);
    console.log(`  ✅ Completed: ${completedCount}`);
    console.log(`  📋 Pending: ${pendingCount}`);
    console.log(`  📅 Date range: 7 days ago to 7 days ahead`);

    return results;
  } catch (error) {
    console.error('Error seeding todos:', error);
    throw error;
  }
}

// Make the function available globally for browser console use
if (typeof window !== 'undefined') {
  (window as any).seedMockTodos = seedMockTodos;
}
