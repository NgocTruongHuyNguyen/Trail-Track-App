export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return '#16a34a' // green
    case 'moderate':
      return '#f59e0b' // orange/amber
    case 'hard':
      return '#dc2626' // red
    default:
      return '#6b7280' // gray for unknown
  }
}

export const DIFFICULTY_LEGEND = [
  { label: 'Easy', color: '#16a34a' },
  { label: 'Moderate', color: '#f59e0b' },
  { label: 'Hard', color: '#dc2626' },
  { label: 'Unknown', color: '#6b7280' },
]