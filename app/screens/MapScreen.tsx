import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, Linking } from 'react-native'
import MapView, { Polyline, Marker } from 'react-native-maps'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTrackStore } from '../store/trackStore'
import { getDifficultyColor } from '../lib/trackColors'
import { getActivityIcon, getPathMidpoint } from '../lib/activityIcons'
import { useUserLocation } from '../hooks/useUserLocation'
import MapLegend from '../components/MapLegand'
import ActivityFilterBar from '../components/ActivityFilterBar'

export default function MapScreen({ navigation }: any) {
  const { session } = useAuthStore()
  const { tracks, completions, loading, error, loadInitialData, activeFilters } = useTrackStore()
  const { location, permissionDenied, loading: locLoading, requestLocation } = useUserLocation()
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    if (session?.user.id) {
      loadInitialData(session.user.id)
    }
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleFindNearMe = async () => {
    const coords = await requestLocation()
    if (!coords) {
      Alert.alert(
        'Location access needed',
        'To find tracks near you, please allow location access in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      )
      return
    }
    mapRef.current?.animateToRegion(
      { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      800
    )
  }

  if (loading && tracks.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading tracks...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  const visibleTracks = tracks.filter((t) => activeFilters.has(t.activity_type))
  const completedCount = Object.keys(completions).length

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{ latitude: -41.5, longitude: 173.0, latitudeDelta: 8, longitudeDelta: 8 }}
        showsUserLocation={!!location}
      >
        {visibleTracks.map((track) => {
          const completion = completions[track.id]
          const isCompleted = !!completion
          const color = getDifficultyColor(track.difficulty)
          const midpoint = getPathMidpoint(track.path)

          return (
            <View key={track.id}>
              <Polyline
                coordinates={track.path}
                strokeColor={color}
                strokeWidth={isCompleted ? 4 : 2.5}
                tappable
                onPress={() => navigation.navigate('TrackDetail', { track, completion })}
              />
              {midpoint && (
                <Marker
                  coordinate={midpoint}
                  onPress={() => navigation.navigate('TrackDetail', { track, completion })}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.iconMarker, isCompleted && styles.iconMarkerCompleted]}>
                    <Text style={styles.iconText}>{getActivityIcon(track.activity_type)}</Text>
                  </View>
                </Marker>
              )}
            </View>
          )
        })}
      </MapView>

      <ActivityFilterBar />
      <MapLegend />

      <Pressable onPress={handleFindNearMe} disabled={locLoading} style={styles.locateButton}>
        {locLoading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.locateButtonText}>📍 Find Near Me</Text>}
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{visibleTracks.length} tracks · {completedCount} completed</Text>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#666' },
  errorText: { color: 'red', textAlign: 'center' },
 iconMarker: {
    backgroundColor: '#e5e7eb', 
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#999',
  },
  iconMarkerCompleted: {
    backgroundColor: '#16a34a', 
    borderColor: '#15803d',
  },
  iconText: { fontSize: 14 },
  locateButton: {
    position: 'absolute', bottom: 90, right: 12,
    backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  locateButtonText: { color: 'white', fontWeight: '600' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  footerText: { color: '#333', fontWeight: '500' },
  logoutButton: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  logoutText: { color: 'white', fontWeight: '600' },
})