import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTrackStore } from '../store/trackStore'
import { getActivityIcon, getActivityLabel } from '../lib/activityIcons'

const FILTER_OPTIONS = ['walking', 'tramping', 'mountain_biking', 'historic']

export default function ActivityFilterBar() {
  const { activeFilters, toggleFilter } = useTrackStore()

  return (
    <View style={styles.container}>
      {FILTER_OPTIONS.map((type) => {
        const active = activeFilters.has(type)
        return (
          <Pressable
            key={type}
            onPress={() => toggleFilter(type)}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={styles.icon}>{getActivityIcon(type)}</Text>
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {getActivityLabel(type)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 90, 
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipInactive: { backgroundColor: 'white' },
  icon: { fontSize: 14, marginRight: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  labelActive: { color: 'white' },
  labelInactive: { color: '#333' },
})