import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTrackStore } from '../store/trackStore'
import { getDifficultyColor } from '../lib/trackColors'

export default function TrackDetailScreen({ route, navigation }: any) {
  const { track, completion } = route.params
  const { session } = useAuthStore()
  const setCompletion = useTrackStore((s) => s.setCompletion)

  const [showForm, setShowForm] = useState(!completion)
  const [date, setDate] = useState(completion ? new Date(completion.date_completed) : new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [hours, setHours] = useState(completion?.duration_minutes ? String(Math.floor(completion.duration_minutes / 60)) : '')
  const [minutes, setMinutes] = useState(completion?.duration_minutes ? String(completion.duration_minutes % 60) : '')
  const [notes, setNotes] = useState(completion?.notes || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')

    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)
    const dateStr = date.toISOString().split('T')[0]

    const payload = {
      user_id: session?.user.id,
      track_id: track.id,
      date_completed: dateStr,
      duration_minutes: totalMinutes || null,
      notes: notes || null,
    }

    const { error } = await supabase
      .from('completions')
      .upsert(payload, { onConflict: 'user_id,track_id' })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setCompletion(payload as any) 
      navigation.goBack()
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{track.name}</Text>
      <Text style={styles.meta}>Distance: {track.distance_km} km</Text>
      <Text style={styles.meta}>Difficulty: {track.difficulty}</Text>
      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(track.difficulty) }]}>
        <Text style={styles.difficultyBadgeText}>{track.difficulty.toUpperCase()}</Text>
      </View>
    
      {completion && !showForm && (
        <View style={styles.completedBox}>
          <Text style={styles.completedTitle}>✓ Completed</Text>
          <Text style={styles.meta}>Date: {completion.date_completed}</Text>
          {completion.duration_minutes ? (
            <Text style={styles.meta}>
              Duration: {Math.floor(completion.duration_minutes / 60)}h {completion.duration_minutes % 60}m
            </Text>
          ) : null}
          {completion.notes ? <Text style={styles.meta}>Notes: {completion.notes}</Text> : null}

          <Pressable onPress={() => setShowForm(true)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>
      )}

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.label}>Date completed</Text>
          <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
            <Text>{date.toISOString().split('T')[0]}</Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios')
                if (selectedDate) setDate(selectedDate)
              }}
            />
          )}

          <Text style={styles.label}>Time taken</Text>
          <View style={styles.durationRow}>
            <TextInput
              placeholder="Hours"
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
              style={[styles.input, styles.durationInput]}
            />
            <TextInput
              placeholder="Minutes"
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="number-pad"
              style={[styles.input, styles.durationInput]}
            />
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            placeholder="How was the track?"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.notesInput]}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={handleSave} disabled={loading} style={styles.button}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save Completion</Text>}
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  meta: { fontSize: 16, color: '#555', marginBottom: 4 },
  completedBox: { marginTop: 16, padding: 16, backgroundColor: '#f0fdf4', borderRadius: 8 },
  completedTitle: { fontSize: 18, color: '#16a34a', fontWeight: '600', marginBottom: 8 },
  editButton: { marginTop: 12, alignSelf: 'flex-start' },
  editButtonText: { color: '#2563eb', fontWeight: '600' },
  form: { marginTop: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  dateInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  durationRow: { flexDirection: 'row', gap: 12 },
  durationInput: { flex: 1 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  error: { color: 'red', marginTop: 12 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  difficultyBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 8, marginBottom: 8 },
  difficultyBadgeText: { color: 'white', fontWeight: '700', fontSize: 12 },
})