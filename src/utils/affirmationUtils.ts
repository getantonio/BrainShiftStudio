import { AffirmationCategory, affirmationCategories } from '../data/affirmations';

export function getMatchingAffirmations(input: string): string[] {
  // Convert input to lowercase for case-insensitive matching
  const lowercaseInput = input.toLowerCase();
  
  // Find matching categories based on keywords
  const matchingCategories = affirmationCategories.filter(category =>
    category.keywords.some(keyword => lowercaseInput.includes(keyword))
  );

  // If no matches, return from quality of life category as default
  if (matchingCategories.length === 0) {
    const defaultCategory = affirmationCategories.find(cat => cat.id === 'quality-of-life');
    return getRandomAffirmations(defaultCategory!.affirmations.map(a => a.text), 5);
  }

  // Get all affirmations from matching categories
  const allMatchingAffirmations = matchingCategories.flatMap(category => 
    category.affirmations.map(a => a.text)
  );

  // Return 5 random affirmations from the matches
  return getRandomAffirmations(allMatchingAffirmations, 5);
}

function getRandomAffirmations(affirmations: string[], count: number): string[] {
  const shuffled = [...affirmations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}