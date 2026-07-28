import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MapScreen from '../screens/MapScreen'
import TrackDetailScreen from '../screens/TrackDetailScreen'
import TrackListScreen from '../screens/TrackListScreen'

const Stack = createNativeStackNavigator()

export default function MapStack() {
  return (
    <Stack.Navigator id={undefined}>
      <Stack.Screen name="MapHome" component={MapScreen} options={{ title: 'Trail Tracker' }} />
      <Stack.Screen name="TrackDetail" component={TrackDetailScreen} options={{ title: 'Track Details' }} />
      <Stack.Screen name="TrackList" component={TrackListScreen} options={{ title: 'Tracks in this area' }} />
    </Stack.Navigator>
  )
}