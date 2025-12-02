/**
 * EventListItem Component
 * Sprint 8 - US-070
 *
 * Displays a single event in the calendar day list
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  location?: string;
  category: {
    icon?: string;
    color?: string;
  };
  syncWithGoogle: boolean;
}

interface EventListItemProps {
  event: Event;
  onPress: () => void;
}

export function EventListItem({ event, onPress }: EventListItemProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const timeDisplay = event.isAllDay
    ? 'Todo el día'
    : `${formatTime(event.startDateTime)} - ${formatTime(event.endDateTime)}`;

  const categoryColor = event.category.color || '#6B7280';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Color indicator */}
      <View style={[styles.colorBar, { backgroundColor: categoryColor }]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Time */}
        <Text style={styles.time}>{timeDisplay}</Text>

        {/* Title row */}
        <View style={styles.titleRow}>
          {/* Category icon */}
          {event.category.icon && (
            <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '20' }]}>
              <Text style={styles.categoryIconText}>{event.category.icon}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>

          {/* Google sync badge */}
          {event.syncWithGoogle && (
            <View style={styles.googleBadge}>
              <Ionicons name="logo-google" size={12} color="#4285F4" />
            </View>
          )}
        </View>

        {/* Location */}
        {event.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.location} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryIconText: {
    fontSize: 14,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  googleBadge: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: '#E8F0FE',
    borderRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
});
