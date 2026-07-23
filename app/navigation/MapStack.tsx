import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MapScreen from '../screens/MapScreen'
import TrackDetailScreen from '../screens/TrackDetailScreen'

const Stack = createNativeStackNavigator()

export default function MapStack() {
  return (
    <Stack.Navigator id={undefined}>
      <Stack.Screen name="MapHome" component={MapScreen} options={{ title: 'Trail Tracker' }} />
      <Stack.Screen name="TrackDetail" component={TrackDetailScreen} options={{ title: 'Track Details' }} />
    </Stack.Navigator>
  )
}