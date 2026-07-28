import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, Linking } from 'react-native'
import MapView, { Marker, Polyline, Region } from 'react-native-maps'
import { useAuthStore } from '../store/authStore'
import { useTrackStore } from '../store/trackStore'
import { getDifficultyColor } from '../lib/trackColors'
import { getActivityIcon, getActivityLabel, getPathMidpoint } from '../lib/activityIcons'
import { useUserLocation } from '../hooks/useUserLocation'
import MapLegend from '../components/MapLegend'
import ActivityFilterBar from '../components/ActivityFilterBar'
import { buildClusterIndexes, getClustersForRegion, getClusterTracks, isTrackPoint } from '../lib/clustering'

const ZOOM_THRESHOLD = 0.8 // below this latitudeDelta, show track lines too

export default function MapScreen({ navigation }: any) {
  const { session } = useAuthStore()
  const { tracks, completions, loading, error, loadInitialData, activeFilters } = useTrackStore()
  const { location, requestLocation } = useUserLocation()
  const mapRef = useRef<MapView>(null)

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

  const visibleTracks = useMemo(
    () => tracks.filter((t) => activeFilters.has(t.activity_type)),
    [tracks, activeFilters]
  )

  // Rebuild clustering indexes only when the underlying track set changes (not on every pan)
  const clusterIndexes = useMemo(() => buildClusterIndexes(visibleTracks), [visibleTracks])

  // Recompute visible clusters whenever the map region changes
  const clusterItems = useMemo(
    () => getClustersForRegion(clusterIndexes, region),
    [clusterIndexes, region]
  )

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

  const handleClusterPress = (activityType: string, clusterId: number) => {
    const clusterTracks = getClusterTracks(clusterIndexes, activityType, clusterId)
    navigation.navigate('TrackList', {
      tracks: clusterTracks,
      completions,
      title: `${clusterTracks.length} ${getActivityLabel(activityType)} tracks`,
    })
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

  const completedCount = Object.keys(completions).length
  const zoomedIn = region.latitudeDelta < ZOOM_THRESHOLD

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={!!location}
      >
        {clusterItems.map((item) => {
          if (item.isCluster) {
            return (
              <Marker
                key={`cluster-${item.activityType}-${item.clusterId}`}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                onPress={() => handleClusterPress(item.activityType, item.clusterId)}
              >
                <View style={styles.clusterBubble}>
                  <Text style={styles.clusterIcon}>{getActivityIcon(item.activityType)}</Text>
                  <Text style={styles.clusterCount}>{item.count}</Text>
                </View>
              </Marker>
            )
          } else if (isTrackPoint(item)) {
            const track = item.track
            const completion = completions[track.id]
            const isCompleted = !!completion

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
                <Marker
                  coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                  onPress={() => navigation.navigate('TrackDetail', { track, completion })}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.iconMarker, isCompleted && styles.iconMarkerCompleted]}>
                    <Text style={styles.iconText}>{getActivityIcon(track.activity_type)}</Text>
                  </View>
                </Marker>
              </View>
            )
          }
        })}
      </MapView>

      <ActivityFilterBar />
      <MapLegend />

      <Pressable onPress={handleFindNearMe} style={styles.locateButton}>
        <Text style={styles.locateButtonText}>📍 Find Near Me</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {visibleTracks.length} tracks · {completedCount} completed
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
  clusterBubble: {
    backgroundColor: 'white',
    borderRadius: 22,
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
    paddingHorizontal: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  clusterIcon: { fontSize: 14 },
  clusterCount: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
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
})