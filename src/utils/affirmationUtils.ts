import { affirmationCategories } from '@/data/affirmations';

// Get random affirmations from a specific category or all categories
export const getRandomAffirmations = (categoryId: string, count: number = 5): string[] => {
  let availableAffirmations: string[] = [];

  if (!categoryId || categoryId === 'all') {
    // Get affirmations from all categories
    availableAffirmations = affirmationCategories.flatMap(category => 
      category.affirmations.map(a => a.text)
    );
  } else {
    // Get affirmations from specific category
    const category = affirmationCategories.find(cat => cat.id === categoryId);
    availableAffirmations = category?.affirmations.map(a => a.text) || [];
  }

  // Shuffle and return requested number of affirmations
  return shuffleArray(availableAffirmations).slice(0, count);
};

// Get affirmations that match the input text
export const getMatchingAffirmations = (input: string): string[] => {
  if (!input.trim()) return [];

  // Convert input to lowercase for case-insensitive matching
  const lowercaseInput = input.toLowerCase();
  
  // Keywords to match against (expand this list as needed)
  const keywords = lowercaseInput.split(' ').filter(word => word.length > 2);
  
  const matchedAffirmations: string[] = [];

  // Search through all categories
  affirmationCategories.forEach(category => {
    category.affirmations.forEach(affirmation => {
      const affirmationText = affirmation.text.toLowerCase();
      
      // Check if any keyword matches
      const matches = keywords.some(keyword => affirmationText.includes(keyword));
      if (matches) {
        matchedAffirmations.push(affirmation.text);
      }
    });
  });

  // If no matches found, return random affirmations
  if (matchedAffirmations.length === 0) {
    return getRandomAffirmations('all', 5);
  }

  // Shuffle and return up to 5 matching affirmations
  return shuffleArray(matchedAffirmations).slice(0, 5);
};

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}