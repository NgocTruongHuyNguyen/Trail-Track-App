import Supercluster from 'supercluster'
import { Track } from '../store/trackStore'

export type TrackCluster = {
  isCluster: true
  clusterId: number
  activityType: string
  count: number
  latitude: number
  longitude: number
}

export type TrackPoint = {
  isCluster: false
  activityType: string
  track: Track
  latitude: number
  longitude: number
}

export type ClusterItem = TrackCluster | TrackPoint

// Builds one Supercluster index per activity type, keyed by activity_type
export function buildClusterIndexes(tracks: Track[]) {
  const byType: Record<string, Track[]> = {}
  for (const track of tracks) {
    if (!byType[track.activity_type]) byType[track.activity_type] = []
    byType[track.activity_type].push(track)
  }

  const indexes: Record<string, Supercluster> = {}
  for (const [activityType, typeTracks] of Object.entries(byType)) {
    const index = new Supercluster({ radius: 150, maxZoom: 16 })
    const points = typeTracks
      .map((track) => {
        const mid = track.path[Math.floor(track.path.length / 2)]
        if (!mid) return null
        return {
          type: 'Feature' as const,
          properties: { track },
          geometry: { type: 'Point' as const, coordinates: [mid.longitude, mid.latitude] },
        }
      })
      .filter(Boolean) as any[]

    index.load(points)
    indexes[activityType] = index
  }

  return indexes
}

// Approximate zoom level from the map's current region
export function getZoomLevel(longitudeDelta: number): number {
  return Math.round(Math.log2(360 / longitudeDelta))
}

export function getClustersForRegion(
  indexes: Record<string, Supercluster>,
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
): ClusterItem[] {
  const bbox: [number, number, number, number] = [
    region.longitude - region.longitudeDelta / 2,
    region.latitude - region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    region.latitude + region.latitudeDelta / 2,
  ]
  const zoom = getZoomLevel(region.longitudeDelta)

  const results: ClusterItem[] = []

  for (const [activityType, index] of Object.entries(indexes)) {
    const clusters = index.getClusters(bbox, zoom)
    for (const c of clusters) {
      const [longitude, latitude] = c.geometry.coordinates
      if (c.properties.cluster) {
        results.push({
          isCluster: true,
          clusterId: c.properties.cluster_id,
          activityType,
          count: c.properties.point_count,
          latitude,
          longitude,
        })
      } else {
        results.push({
          isCluster: false,
          activityType,
          track: c.properties.track,
          latitude,
          longitude,
        })
      }
    }
  }

  return results
}

// Get all tracks inside a specific cluster bubble, for the "view list" tap action
export function getClusterTracks(
  indexes: Record<string, Supercluster>,
  activityType: string,
  clusterId: number
): Track[] {
  const index = indexes[activityType]
  if (!index) return []
  const leaves = index.getLeaves(clusterId, Infinity)
  return leaves.map((leaf: any) => leaf.properties.track).filter(Boolean)
}

export function isTrackPoint(item: ClusterItem): item is TrackPoint {
  return item.isCluster === false
}