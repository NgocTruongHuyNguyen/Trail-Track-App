import { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'

export default function MapLegend() {
  const [expanded, setExpanded] = useState(true)

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <Text style={styles.headerText}>Legend {expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.row}>
            <View style={[styles.circle, { backgroundColor: '#16a34a', borderColor: '#15803d' }]} />
            <Text style={styles.label}>Completed</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.circle, { backgroundColor: '#e5e7eb', borderColor: '#999' }]} />
            <Text style={styles.label}>Not completed</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'white', borderRadius: 10, padding: 10,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    minWidth: 140,
  },
  header: { alignItems: 'center' },
  headerText: { fontWeight: '700', fontSize: 13 },
  body: { marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  circle: { width: 16, height: 16, borderRadius: 8, marginRight: 8, borderWidth: 1.5 },
  label: { fontSize: 12, color: '#333' },
})