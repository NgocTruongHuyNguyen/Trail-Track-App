require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE_URL = 'https://mapserver.doc.govt.nz/arcgis/rest/services/DTO/AllTracks/MapServer/0/query'
const PAGE_SIZE = 2000

// Maps DOC's OBJECT_TYPE codes to your app's activity_type + difficulty
const TYPE_MAP = {
  TKV01: { activity: 'walking', difficulty: 'easy' },
  TKV02: { activity: 'walking', difficulty: 'easy' },
  TKV03: { activity: 'walking', difficulty: 'easy' },
  TKV04: { activity: 'walking', difficulty: 'moderate' },
  TKV05: { activity: 'tramping', difficulty: 'moderate' },
  TKV06: { activity: 'tramping', difficulty: 'hard' },
  TKV07: { activity: 'tramping', difficulty: 'hard' },
  TKV08: { activity: 'historic', difficulty: 'unknown' },
  TKV10: { activity: 'mountain_biking', difficulty: 'unknown' },
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calculateDistanceKm(coordinates) {
  let total = 0
  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1]
    const [lng2, lat2] = coordinates[i]
    total += haversine(lat1, lng1, lat2, lng2)
  }
  return Math.round(total * 100) / 100
}

async function fetchAllFeatures() {
  let offset = 0
  let allFeatures = []

  while (true) {
    const url = `${BASE_URL}?where=1=1&outFields=*&f=geojson&outSR=4326&resultOffset=${offset}&resultRecordCount=${PAGE_SIZE}`
    console.log(`Fetching offset ${offset}...`)

    const response = await fetch(url)
    const data = await response.json()

    if (!data.features || data.features.length === 0) break

    allFeatures.push(...data.features)
    offset += PAGE_SIZE

    if (offset > 20000) break // safety stop
  }

  console.log(`Fetched ${allFeatures.length} total features`)
  return allFeatures
}

async function importTracks() {
  const features = await fetchAllFeatures()

  // Group by TECHIDENTNO since a single track may be split into multiple line segments
  const trackMap = new Map()

  for (const feature of features) {
    const { geometry, properties } = feature
    if (!geometry?.coordinates?.length || !properties?.TECHIDENTNO) continue

    let segments = []
    if (geometry.type === 'LineString') {
      segments = [geometry.coordinates]
    } else if (geometry.type === 'MultiLineString') {
      segments = geometry.coordinates
    } else {
      continue
    }

    const id = properties.TECHIDENTNO
    if (!trackMap.has(id)) {
      trackMap.set(id, { properties, segments: [] })
    }
    trackMap.get(id).segments.push(...segments)
  }

  console.log(`Grouped into ${trackMap.size} unique tracks`)

  const rows = []
  for (const [techId, { properties, segments }] of trackMap) {
    const allCoords = segments.flat()
    if (!allCoords.length) continue

    const path = allCoords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
    const typeInfo = TYPE_MAP[properties.OBJECT_TYPE] || { activity: 'walking', difficulty: 'unknown' }

    rows.push({
      name: properties.DESCRIPTION || 'Unnamed Track',
      difficulty: typeInfo.difficulty,
      activity_type: typeInfo.activity,
      distance_km: calculateDistanceKm(allCoords),
      path,
      source: 'DOC',
      doc_track_id: techId,
      doc_object_id: properties.OBJECTID,
      status: properties.STATUS || 'UNKNOWN',
      category: properties.CATEGORY_DESCRIPTION || null,
      object_type_code: properties.OBJECT_TYPE || null,
      object_type_description: properties.OBJECT_TYPE_DESCRIPTION || null,
    })
  }

  console.log(`Prepared ${rows.length} rows. Uploading...`)

  const BATCH_SIZE = 200
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('tracks')
      .upsert(batch, { onConflict: 'doc_track_id' })

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE} failed:`, error.message)
    } else {
      inserted += batch.length
      console.log(`Imported batch ${i / BATCH_SIZE + 1} — ${inserted} tracks so far`)
    }
  }

  console.log(`Done. Inserted/updated: ${inserted}`)
}

importTracks()