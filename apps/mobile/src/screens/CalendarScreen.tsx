/**
 * CalendarScreen
 * Sprint 8 - US-070
 *
 * Monthly calendar view with event listing
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { EventListItem } from '../components/EventListItem';

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  location?: string;
  status: string;
  category: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  syncWithGoogle: boolean;
  googleEventId?: string;
}

interface MarkedDates {
  [date: string]: {
    marked?: boolean;
    dots?: Array<{ color: string }>;
    selected?: boolean;
    selectedColor?: string;
  };
}

export function CalendarScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().split('T')[0].slice(0, 7)
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory] = useState<string | null>(null);
  const [filterSource] = useState<'all' | 'local' | 'google'>('all');
  const [filterStatus] = useState<string | null>(null);
  const [showSyncBanner, setShowSyncBanner] = useState(true);

  // Fetch events for current month
  const fetchEvents = async (_month: string, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // const [year, monthNum] = month.split('-');
      // const firstDay = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      // const lastDay = new Date(parseInt(year), parseInt(monthNum), 0);
      // const from = firstDay.toISOString();
      // const to = lastDay.toISOString();

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/events?from=${from}&to=${to}`);
      // const data = await response.json();

      // Mock data for now
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Reunión de equipo',
          startDateTime: `${selectedDate}T10:00:00Z`,
          endDateTime: `${selectedDate}T11:00:00Z`,
          isAllDay: false,
          location: 'Sala de conferencias',
          status: 'pendiente',
          category: {
            id: '1',
            name: 'Trabajo',
            icon: '💼',
            color: '#3B82F6',
          },
          syncWithGoogle: true,
          googleEventId: 'google-123',
        },
        {
          id: '2',
          title: 'Cumpleaños de María',
          startDateTime: `${selectedDate}T00:00:00Z`,
          endDateTime: `${selectedDate}T23:59:59Z`,
          isAllDay: true,
          status: 'pendiente',
          category: {
            id: '2',
            name: 'Personal',
            icon: '🎂',
            color: '#EC4899',
          },
          syncWithGoogle: false,
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentMonth);
  }, [currentMonth]);

  // Handle pull to refresh
  const onRefresh = async () => {
    await fetchEvents(currentMonth, true);
    // TODO: Trigger Google Calendar sync if enabled
  };

  // Get events for selected date
  const getEventsForDate = (date: string) => {
    return events
      .filter((event) => {
        const eventDate = new Date(event.startDateTime).toISOString().split('T')[0];
        if (eventDate !== date) return false;

        // Apply filters
        if (filterCategory && event.category.id !== filterCategory) return false;
        if (filterSource === 'local' && event.syncWithGoogle) return false;
        if (filterSource === 'google' && !event.syncWithGoogle) return false;
        if (filterStatus && event.status !== filterStatus) return false;

        return true;
      })
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      });
  };

  // Mark dates with events
  const getMarkedDates = (): MarkedDates => {
    const marked: MarkedDates = {};

    // Group events by date
    events.forEach((event) => {
      const eventDate = new Date(event.startDateTime).toISOString().split('T')[0];

      if (!marked[eventDate]) {
        marked[eventDate] = { marked: true, dots: [] };
      }

      // Add dot for event category color
      if (event.category.color && marked[eventDate].dots) {
        // Limit to 3 dots max
        if (marked[eventDate].dots!.length < 3) {
          marked[eventDate].dots!.push({ color: event.category.color });
        }
      }
    });

    // Highlight selected date
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#3B82F6';
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#3B82F6',
      };
    }

    return marked;
  };

  const dayEvents = getEventsForDate(selectedDate);
  const markedDates = getMarkedDates();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendario</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CalendarSync')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Sync Banner */}
        {showSyncBanner && (
          <View style={styles.syncBanner}>
            <View style={styles.syncBannerContent}>
              <Ionicons name="cloud-outline" size={24} color="#3B82F6" />
              <View style={styles.syncBannerText}>
                <Text style={styles.syncBannerTitle}>Sincroniza con Google Calendar</Text>
                <Text style={styles.syncBannerDescription}>
                  Conecta tu cuenta para sincronizar eventos automáticamente
                </Text>
              </View>
            </View>
            <View style={styles.syncBannerActions}>
              <TouchableOpacity
                onPress={() => setShowSyncBanner(false)}
                style={styles.syncBannerDismiss}
              >
                <Text style={styles.syncBannerDismissText}>Ahora no</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('CalendarSync')}
                style={styles.syncBannerConnect}
              >
                <Text style={styles.syncBannerConnectText}>Conectar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowSyncBanner(false)}
              style={styles.syncBannerClose}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Calendar */}
        <Calendar
          current={selectedDate}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          onMonthChange={(month: DateData) => {
            setCurrentMonth(month.dateString.slice(0, 7));
          }}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#6B7280',
            selectedDayBackgroundColor: '#3B82F6',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#3B82F6',
            dayTextColor: '#111827',
            textDisabledColor: '#D1D5DB',
            dotColor: '#3B82F6',
            selectedDotColor: '#FFFFFF',
            arrowColor: '#3B82F6',
            monthTextColor: '#111827',
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          style={styles.calendar}
        />

        {/* Selected date header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>
            {new Date(selectedDate).toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          <Text style={styles.eventCount}>
            {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
          </Text>
        </View>

        {/* Events list */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No hay eventos este día</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {dayEvents.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                onPress={() => {
                  // TODO: Navigate to EventDetailScreen
                  console.log('Navigate to event detail:', event.id);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to CreateEventScreen
          console.log('Create new event');
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  settingsButton: {
    padding: 4,
  },
  syncBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  syncBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  syncBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 2,
  },
  syncBannerDescription: {
    fontSize: 13,
    color: '#3B82F6',
  },
  syncBannerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  syncBannerDismiss: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  syncBannerDismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  syncBannerConnect: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  syncBannerConnectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  syncBannerClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  calendar: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  eventCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  eventsList: {
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
