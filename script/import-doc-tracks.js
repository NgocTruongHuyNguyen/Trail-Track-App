require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Haversine distance between two lat/lng points, in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateDistanceKm(coordinates) {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    total += haversine(lat1, lng1, lat2, lng2);
  }
  return Math.round(total * 100) / 100; // 2 decimal places
}

// Extract the CharName/CharValue key-value pairs into a clean object
function extractCharFields(properties) {
  const fields = {};
  for (let i = 1; i <= 11; i++) {
    const name = properties[`CharName${i}`];
    const value = properties[`CharValue${i}`];
    if (name) fields[name] = value;
  }
  return fields;
}

// Rough difficulty guess from track category — adjust as you learn more from the data
function guessDifficulty(category) {
  if (!category) return 'unknown';
  const c = category.toLowerCase();
  if (c.includes('walk')) return 'easy';
  if (c.includes('great walk')) return 'moderate';
  if (c.includes('tramping')) return 'moderate';
  if (c.includes('route')) return 'hard';
  return 'unknown';
}

async function importTracks() {
  const raw = fs.readFileSync('./data/doc-tracks.geojson', 'utf8');
  const geojson = JSON.parse(raw);

  console.log(`Found ${geojson.features.length} features. Grouping by track ID...`);

  // Group all features by FlocID, merging multi-segment tracks into one row
  const trackMap = new Map();

  for (const feature of geojson.features) {
    const { geometry, properties } = feature;
    if (!geometry || !properties?.FlocID) continue;

    // Handle both LineString and MultiLineString
    let segments = [];
    if (geometry.type === 'LineString') {
      segments = [geometry.coordinates];
    } else if (geometry.type === 'MultiLineString') {
      segments = geometry.coordinates;
    } else {
      continue; // skip points/polygons etc.
    }

    const flocId = properties.FlocID;
    if (!trackMap.has(flocId)) {
      trackMap.set(flocId, { properties, segments: [] });
    }
    trackMap.get(flocId).segments.push(...segments);
  }

  console.log(`Grouped into ${trackMap.size} unique tracks. Starting import...`);

  const allRows = [];
  let skipped = 0;

  for (const [flocId, { properties, segments }] of trackMap) {
    // Flatten all segments into one continuous path for simplicity
    // (good enough for map rendering; order may not be perfectly continuous but visually fine)
    const allCoords = segments.flat();
    if (!allCoords.length) {
      skipped++;
      continue;
    }

    const charFields = extractCharFields(properties);
    const path = allCoords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

    allRows.push({
      name: properties.TechObjectName || 'Unnamed Track',
      description: charFields.WEB_PERMITTED_ACTIVITIES || null,
      difficulty: guessDifficulty(charFields.WEB_CATEGORY_TRACK),
      distance_km: calculateDistanceKm(allCoords),
      estimated_duration_minutes: null,
      path,
      region: null,
      source: 'DOC',
      doc_track_id: flocId,
      doc_object_id: properties.OBJECTID,
      status: charFields.USER_STATUS || 'UNKNOWN',
      category: charFields.WEB_CATEGORY_TRACK || null,
      dogs_allowed: charFields.WEB_DOGS_ALLOWED || null,
      permitted_activities: charFields.WEB_PERMITTED_ACTIVITIES || null,
    });
  }

  console.log(`Prepared ${allRows.length} rows. Uploading in batches...`);

  const BATCH_SIZE = 200;
  let inserted = 0;

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('tracks')
      .upsert(batch, { onConflict: 'doc_track_id' });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE} failed:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Imported batch ${i / BATCH_SIZE + 1} — ${inserted} tracks so far`);
    }
  }

  console.log(`Done. Inserted/updated: ${inserted}, Skipped (no geometry): ${skipped}`);
}

importTracks();