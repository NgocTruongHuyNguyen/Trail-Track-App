import { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { DIFFICULTY_LEGEND } from '../lib/trackColors'

export default function MapLegend() {
  const [expanded, setExpanded] = useState(true)

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <Text style={styles.headerText}>Legend {expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Difficulty (color)</Text>
          {DIFFICULTY_LEGEND.map((item) => (
            <View key={item.label} style={styles.row}>
              <View style={[styles.swatch, { backgroundColor: item.color }]} />
              <Text style={styles.label}>{item.label}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Status (line style)</Text>
          <View style={styles.row}>
            <View style={[styles.lineSample, styles.solidLine]} />
            <Text style={styles.label}>Completed</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.lineSample, styles.fadedLine]} />
            <Text style={styles.label}>Not completed</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    minWidth: 150,
  },
  header: { alignItems: 'center' },
  headerText: { fontWeight: '700', fontSize: 13 },
  body: { marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  swatch: { width: 14, height: 14, borderRadius: 3, marginRight: 8 },
  label: { fontSize: 12, color: '#333' },
  lineSample: { width: 24, height: 4, marginRight: 8, borderRadius: 2 },
  solidLine: { backgroundColor: '#333', opacity: 1 },
  fadedLine: { backgroundColor: '#333', opacity: 0.35 },
})