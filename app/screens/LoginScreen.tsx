import { useState, useCallback } from 'react'
import { View, TextInput, Pressable, Text, StyleSheet, ImageBackground } from 'react-native'
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '../lib/supabase'

SplashScreen.preventAutoHideAsync()

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  })

  const onLayout = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <View style={styles.root} onLayout={onLayout}>
      <ImageBackground
        source={require('../../assets/Loginback-1.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Fade overlay — darkens/lightens the image so the form stays readable */}
        <View style={styles.overlay} />

        <View style={styles.container}>
          <Text style={styles.appName}>Outdoor Activities Planner</Text>

          <View style={styles.formCard}>
            <Text style={styles.title}>Log In</Text>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Signup')} style={styles.linkButton}>
              <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // fades the image so the form is clearly legible
  },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  appName: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 28,
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 32,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontFamily: 'Roboto_700Bold', fontSize: 24, marginBottom: 20, color: '#111' },
  input: {
    fontFamily: 'Roboto_400Regular',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  error: { fontFamily: 'Roboto_400Regular', color: 'red', marginBottom: 12 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: 'Roboto_500Medium', color: 'white', fontSize: 16 },
  linkButton: { marginTop: 16, alignItems: 'center' },
  linkText: { fontFamily: 'Roboto_400Regular', color: '#2563eb' },
})