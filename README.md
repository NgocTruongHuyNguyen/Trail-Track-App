# Trail-track-app by Huy Nguyen
A cross-platform mobile app for discovering NZ walking, tramping, and 
mountain biking tracks sourced from DOC (Department of Conservation) open 
data. Track which trails you've completed, log your times, and check 
current weather conditions before heading out.

## Features
- Browse ~1,000+ DOC-sourced tracks on an interactive map
- Filter tracks by activity type (walking, tramping, mountain biking)
- Color-coded difficulty levels (easy/moderate/hard)
- Mark tracks as completed with date, duration, and notes
- View current weather conditions for any track
- Find tracks near your current location
- User profiles with hobbies and personal info
- Email/password authentication

## Tech Stack
- **Frontend:** React Native (Expo), TypeScript
- **Navigation:** React Navigation (bottom tabs + native stack)
- **State management:** Zustand
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **Maps:** react-native-maps
- **Weather:** Open-Meteo API
- **Data source:** NZ DOC (Department of Conservation) open track data

## Prerequisites
- Node.js (LTS)
- Expo Go app (iOS/Android) or iOS Simulator / Android Emulator
- A Supabase account and project

## Setup

1. Clone the repo and install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create a `.env` file in the root with:
   \`\`\`
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   \`\`\`

3. Run the database schema (see `/schema.sql` or Supabase SQL Editor)

4. Import track data from DOC:
   \`\`\`bash
   node script/import-doc-tracks.js
   \`\`\`

5. Start the app:
   \`\`\`bash
   npx expo start
   \`\`\`

## Project Structure
\`\`\`
app/
  screens/       # Login, Signup, Map, TrackDetail, UserDetail
  navigation/     # Tab/stack navigator setup
  store/          # Zustand stores (auth, tracks, profile)
  lib/            # Supabase client, weather API, color/icon helpers
  hooks/          # useUserLocation
script/
  import-doc-tracks.js   # Pulls track data from DOC ArcGIS API
\`\`\`

## Data Attribution
Track data sourced from the Department of Conservation (DOC) Te Papa Atawhai, 
licensed under CC BY 4.0. 
Crown Copyright: Department of Conservation Te Papa Atawhai.

Track information may be out of date — always confirm current track status 
via DOC's official website before heading out.