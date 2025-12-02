/**
 * TimelineItem Component
 * Sprint 6 - US-052
 *
 * Displays a single audit log entry in timeline format
 */

import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HabitAuditLog } from '../../api/habits.api';
import { formatAuditValue, getFieldDisplayName } from '../../utils/auditFormatters';

interface TimelineItemProps {
  log: HabitAuditLog;
}

const CHANGE_TYPE_CONFIG: Record<
  string,
  { icon: string; label: string; color: string; bgColor: string }
> = {
  CREATED: {
    icon: '✨',
    label: 'Creado',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
  UPDATED: {
    icon: '✏️',
    label: 'Modificado',
    color: '#2196F3',
    bgColor: '#E3F2FD',
  },
  DELETED: {
    icon: '🗑️',
    label: 'Eliminado',
    color: '#F44336',
    bgColor: '#FFEBEE',
  },
  REACTIVATED: {
    icon: '🔄',
    label: 'Reactivado',
    color: '#FF9800',
    bgColor: '#FFF3E0',
  },
};

export const TimelineItem = ({ log }: TimelineItemProps) => {
  const config = CHANGE_TYPE_CONFIG[log.changeType] || {
    icon: '📝',
    label: log.changeType,
    color: '#757575',
    bgColor: '#F5F5F5',
  };

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(log.createdAt), {
    addSuffix: true,
    locale: es,
  });

  // Format old and new values
  const oldValueFormatted = formatAuditValue(log.fieldChanged, log.oldValue);
  const newValueFormatted = formatAuditValue(log.fieldChanged, log.newValue);

  // Get field display name
  const fieldName = getFieldDisplayName(log.fieldChanged);

  return (
    <View style={styles.container}>
      {/* Timeline line */}
      <View style={styles.timelineColumn}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        <View style={styles.timelineLine} />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={[styles.card, { borderLeftColor: config.color }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.changeTypeLabel, { color: config.color }]}>{config.label}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>

          {/* Field changed */}
          {log.fieldChanged && <Text style={styles.fieldName}>{fieldName}</Text>}

          {/* Change details */}
          {log.changeType === 'UPDATED' && log.fieldChanged && (
            <View style={styles.changeContainer}>
              {/* Old value */}
              <View style={styles.valueContainer}>
                {oldValueFormatted.color ? (
                  <View style={styles.colorRow}>
                    <View
                      style={[styles.colorSwatch, { backgroundColor: oldValueFormatted.color }]}
                    />
                    <Text style={styles.oldValue}>{oldValueFormatted.text}</Text>
                  </View>
                ) : (
                  <Text style={styles.oldValue}>{oldValueFormatted.text}</Text>
                )}
              </View>

              {/* Arrow */}
              <Text style={styles.arrow}>→</Text>

              {/* New value */}
              <View style={styles.valueContainer}>
                {newValueFormatted.color ? (
                  <View style={styles.colorRow}>
                    <View
                      style={[styles.colorSwatch, { backgroundColor: newValueFormatted.color }]}
                    />
                    <Text style={styles.newValue}>{newValueFormatted.text}</Text>
                  </View>
                ) : (
                  <Text style={styles.newValue}>{newValueFormatted.text}</Text>
                )}
              </View>
            </View>
          )}

          {/* Reason */}
          {log.reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Motivo:</Text>
              <Text style={styles.reasonText}>{log.reason}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 40,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeTypeLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontSize: 12,
    color: '#757575',
  },
  fieldName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  valueContainer: {
    flex: 1,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  oldValue: {
    fontSize: 14,
    color: '#757575',
    textDecorationLine: 'line-through',
  },
  arrow: {
    fontSize: 16,
    color: '#757575',
    marginHorizontal: 8,
  },
  newValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  reasonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  reasonLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
});
