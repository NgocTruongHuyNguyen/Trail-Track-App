import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, Linking } from 'react-native'
import ClusterMapView from 'react-native-map-clustering'
import { Marker, Polyline, Region } from 'react-native-maps'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTrackStore } from '../store/trackStore'
import { getDifficultyColor } from '../lib/trackColors'
import { getActivityIcon, getPathMidpoint } from '../lib/activityIcons'
import { useUserLocation } from '../hooks/useUserLocation'
import MapLegend from '../components/MapLegand'
import ActivityFilterBar from '../components/ActivityFilterBar'

const ZOOM_THRESHOLD = 0.8 
const AnyMarker = Marker as any

export default function MapScreen({ navigation }: any) {
  const { session } = useAuthStore()
  const { tracks, completions, loading, error, loadInitialData, activeFilters } = useTrackStore()
  const { location, requestLocation } = useUserLocation()
  const mapRef = useRef<any>(null)
  const [region, setRegion] = useState<Region>({
    latitude: -41.5,
    longitude: 173.0,
    latitudeDelta: 8,
    longitudeDelta: 8,
  })

  useEffect(() => {
    if (session?.user.id) {
      loadInitialData(session.user.id)
    }
  }, [session])

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
      { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.3, longitudeDelta: 0.3 },
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
  const zoomedIn = region.latitudeDelta < ZOOM_THRESHOLD

  return (
    <View style={styles.container}>
      <ClusterMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={!!location}
        radius={60}
        preserveClusterPressBehavior={true}
        onClusterPress={(cluster, markers) => {
          const clusterTracks = markers.map((m: any) => m.properties?.track).filter(Boolean)
          navigation.navigate('TrackList', { tracks: clusterTracks, completions })
        }}
        renderCluster={(cluster) => {
          const { id, geometry, onPress, properties } = cluster
          const count = properties.point_count

          return (
            <Marker
              key={`cluster-${id}`}
              coordinate={{ longitude: geometry.coordinates[0], latitude: geometry.coordinates[1] }}
              onPress={onPress}
            >
              <View style={styles.clusterBubble}>
                <Text style={styles.clusterCount}>{count}</Text>
                <Text style={styles.clusterLabel}>tracks</Text>
              </View>
            </Marker>
          )
        }}
      >
        {visibleTracks.map((track) => {
          const completion = completions[track.id]
          const isCompleted = !!completion
          const midpoint = getPathMidpoint(track.path)
          if (!midpoint) return null

          return (
            <View key={track.id}>
              {zoomedIn && (
                <Polyline
                  coordinates={track.path}
                  strokeColor={getDifficultyColor(track.difficulty)}
                  strokeWidth={3}
                  tappable
                  onPress={() => navigation.navigate('TrackDetail', { track, completion })}
                />
              )}
              <AnyMarker
                coordinate={midpoint}
                track={track}
                onPress={() => navigation.navigate('TrackDetail', { track, completion })}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.iconMarker, isCompleted && styles.iconMarkerCompleted]}>
                  <Text style={styles.iconText}>{getActivityIcon(track.activity_type)}</Text>
                </View>
              </AnyMarker>
            </View>
          )
        })}
      </ClusterMapView>

      <ActivityFilterBar />
      <MapLegend />

      <Pressable onPress={handleFindNearMe} style={styles.locateButton}>
        <Text style={styles.locateButtonText}>📍 Find Near Me</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {zoomedIn ? `${visibleTracks.length} tracks shown` : 'Zoom in to see individual tracks'} · {completedCount} completed
        </Text>
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
    backgroundColor: '#e5e7eb', borderRadius: 14, width: 28, height: 28,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#999',
  },
  iconMarkerCompleted: { backgroundColor: '#16a34a', borderColor: '#15803d' },
  iconText: { fontSize: 14 },
  locateButton: {
    position: 'absolute', bottom: 90, right: 12,
    backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  locateButtonText: { color: 'white', fontWeight: '600' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#eee',
  },
  footerText: { color: '#333', fontWeight: '500', textAlign: 'center' },

  clusterBubble: {
    backgroundColor: '#2563eb',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  clusterCount: { color: 'white', fontWeight: '700', fontSize: 16 },
  clusterLabel: { color: 'white', fontSize: 9 },
})