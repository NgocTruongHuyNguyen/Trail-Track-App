import { useState, useCallback } from 'react'
import * as Location from 'expo-location'

export function useUserLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requestLocation = useCallback(async () => {
    setLoading(true)
    setError('')

    const { status } = await Location.requestForegroundPermissionsAsync()

    if (status !== 'granted') {
      setPermissionDenied(true)
      setLoading(false)
      return null
    }

    setPermissionDenied(false)

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
      setLocation(coords)
      setLoading(false)
      return coords
    } catch (e: any) {
      setError(e.message || 'Could not get location')
      setLoading(false)
      return null
    }
  }, [])

  return { location, permissionDenied, loading, error, requestLocation }
}