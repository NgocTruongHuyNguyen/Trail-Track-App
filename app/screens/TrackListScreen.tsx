import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { getActivityIcon, getActivityLabel } from '../lib/activityIcons'
import { getDifficultyColor } from '../lib/trackColors'

export default function TrackListScreen({ route, navigation }: any) {
  const { tracks, completions } = route.params

  return (
    <View style={styles.container}>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: track }) => {
          const completion = completions[track.id]
          const isCompleted = !!completion

          return (
            <Pressable
              onPress={() => navigation.navigate('TrackDetail', { track, completion })}
              style={styles.card}
            >
              <Text style={styles.icon}>{getActivityIcon(track.activity_type)}</Text>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{track.name}</Text>
                <Text style={styles.meta}>
                  {getActivityLabel(track.activity_type)} · {track.distance_km} km
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(track.difficulty) }]} />
                  <Text style={styles.difficultyText}>{track.difficulty}</Text>
                </View>
              </View>
              {isCompleted && <Text style={styles.completedCheck}>✓</Text>}
            </Pressable>
          )
        }}
        ListEmptyComponent={<Text style={styles.empty}>No tracks in this area</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: { fontSize: 24, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  difficultyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  difficultyText: { fontSize: 11, color: '#666', textTransform: 'capitalize' },
  completedCheck: { fontSize: 18, color: '#16a34a', fontWeight: '700', marginLeft: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
})