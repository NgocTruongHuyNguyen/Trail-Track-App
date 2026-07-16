import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './app/lib/supabase'
import { useAuthStore } from './app/store/authStore'
import LoginScreen from './app/screens/LoginScreen'
import SignupScreen from './app/screens/SignupScreen'
// import MapScreen from './app/screens/MapScreen'
// import TrackDetailScreen from './app/screens/TrackDetailScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const { session, setSession } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session ? (
          <>
            <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Trail Tracker' }} />
            <Stack.Screen name="TrackDetail" component={TrackDetailScreen} options={{ title: 'Track Details' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}