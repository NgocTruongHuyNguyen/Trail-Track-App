export const ACTIVITY_ICONS: Record<string, string> = {
  walking: '🚶',
  tramping: '🥾',
  mountain_biking: '🚵',
  historic: '🏛️',
}

export const ACTIVITY_LABELS: Record<string, string> = {
  walking: 'Walking',
  tramping: 'Tramping',
  mountain_biking: 'Mountain Biking',
  historic: 'Historic',
}

export function getActivityIcon(activityType: string): string {
  return ACTIVITY_ICONS[activityType] || '📍'
}

export function getActivityLabel(activityType: string): string {
  return ACTIVITY_LABELS[activityType] || 'Other'
}

export function getPathMidpoint(path: { latitude: number; longitude: number }[]) {
  if (!path.length) return null
  return path[Math.floor(path.length / 2)]
}