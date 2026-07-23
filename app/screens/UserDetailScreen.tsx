import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const HOBBY_OPTIONS = [
  { value: 'walking', label: '🚶 Walking' },
  { value: 'tramping', label: '🥾 Tramping' },
  { value: 'mountain_biking', label: '🚵 Mountain Biking' },
]

export default function UserDetailScreen() {
  const { session } = useAuthStore()
  const { profile, loading, error, fetchProfile, updateProfile } = useProfileStore()

  const [name, setName] = useState('')
  const [gender, setGender] = useState<string | null>(null)
  const [dob, setDob] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [hobbies, setHobbies] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (session?.user.id) {
      fetchProfile(session.user.id)
    }
  }, [session])

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setGender(profile.gender)
      setDob(profile.date_of_birth ? new Date(profile.date_of_birth) : null)
      setHobbies(profile.hobbies || [])
      setLocation(profile.location || '')
    }
  }, [profile])

  const toggleHobby = (value: string) => {
    setHobbies((prev) =>
      prev.includes(value) ? prev.filter((h) => h !== value) : [...prev, value]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const success = await updateProfile({
      name,
      gender: gender as any,
      date_of_birth: dob ? dob.toISOString().split('T')[0] : null,
      hobbies,
      location,
    })
    setSaving(false)
    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>My Profile</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        style={styles.input}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.chipRow}>
        {GENDER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setGender(opt.value)}
            style={[styles.chip, gender === opt.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, gender === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Date of Birth</Text>
      <Pressable onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{dob ? dob.toISOString().split('T')[0] : 'Select date'}</Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={dob || new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios')
            if (selectedDate) setDob(selectedDate)
          }}
        />
      )}

      <Text style={styles.label}>Hobbies</Text>
      <View style={styles.chipRow}>
        {HOBBY_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => toggleHobby(opt.value)}
            style={[styles.chip, hobbies.includes(opt.value) && styles.chipActive]}
          >
            <Text style={[styles.chipText, hobbies.includes(opt.value) && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Location</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. Christchurch, NZ"
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleSave} disabled={saving} style={styles.button}>
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{saved ? '✓ Saved' : 'Save Profile'}</Text>
        )}
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#333', fontSize: 13 },
  chipTextActive: { color: 'white', fontWeight: '600' },
  error: { color: 'red', marginTop: 12 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
})