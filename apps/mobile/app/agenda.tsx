import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
  isToday,
  isSameDay,
  parseISO,
  isSameMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Plus,
  X,
  MapPin,
  AlignLeft,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, Shadows, Typography } from '@/tokens';
import {
  useCalendarEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useEventCategories,
} from '@/hooks/useEvents';
import type { CalendarEvent, CreateEventDTO, UpdateEventDTO } from '@/services/api/eventApi';
import type { EventCategory } from '@/services/api/categoryApi';

// ─── helpers ──────────────────────────────────────────────────────────────────

function groupEventsByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.startDateTime.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, data]) => ({ dateKey, data }));
}

function formatEventTime(event: CalendarEvent): string {
  if (event.isAllDay) return 'Todo el día';
  try {
    return format(parseISO(event.startDateTime), 'HH:mm');
  } catch {
    return '';
  }
}

function formatSectionHeader(dateKey: string): string {
  try {
    const d = parseISO(dateKey);
    if (isToday(d)) return `Hoy — ${format(d, "EEEE d 'de' MMMM", { locale: es })}`;
    return format(d, "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return dateKey;
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── MiniCalendar ──────────────────────────────────────────────────────────────

interface MiniCalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  daysWithEvents: Set<string>;
  onSelectDate: (d: Date) => void;
  onPrev: () => void;
  onNext: () => void;
}

const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function MiniCalendar({
  currentMonth,
  selectedDate,
  daysWithEvents,
  onSelectDate,
  onPrev,
  onNext,
}: MiniCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    <View style={calStyles.container}>
      {/* Header */}
      <View style={calStyles.header}>
        <TouchableOpacity
          onPress={onPrev}
          style={calStyles.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>
          {capitalize(format(currentMonth, 'MMMM yyyy', { locale: es }))}
        </Text>
        <TouchableOpacity
          onPress={onNext}
          style={calStyles.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronRight size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Week labels */}
      <View style={calStyles.weekRow}>
        {WEEK_LABELS.map((l, i) => (
          <Text key={i} style={calStyles.weekLabel}>
            {l}
          </Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={calStyles.grid}>
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const todayDay = isToday(day);
          const key = format(day, 'yyyy-MM-dd');
          const hasDot = daysWithEvents.has(key);

          return (
            <TouchableOpacity
              key={i}
              style={calStyles.dayCell}
              onPress={() => isCurrentMonth && onSelectDate(day)}
              activeOpacity={isCurrentMonth ? 0.7 : 1}
            >
              <View
                style={[
                  calStyles.dayCircle,
                  isSelected && calStyles.dayCircleSelected,
                  !isSelected && todayDay && calStyles.dayCircleToday,
                ]}
              >
                <Text
                  style={[
                    calStyles.dayText,
                    !isCurrentMonth && calStyles.dayTextOther,
                    isSelected && calStyles.dayTextSelected,
                    !isSelected && todayDay && calStyles.dayTextToday,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </View>
              {hasDot && isCurrentMonth && !isSelected && <View style={calStyles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceSolid,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  navBtn: {
    padding: 4,
  },
  monthLabel: {
    ...Typography.bodyStrong,
    color: Colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    ...Typography.micro,
    color: Colors.muted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: Colors.vivid,
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: Colors.vivid,
  },
  dayText: {
    ...Typography.caption,
    color: Colors.text,
  },
  dayTextOther: {
    color: Colors.muted,
    opacity: 0.4,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  dayTextToday: {
    color: Colors.vivid,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.vivid,
    marginTop: 1,
  },
});

// ─── EventCard ─────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: CalendarEvent;
  isLast: boolean;
  onPress: () => void;
}

function EventCard({ event, isLast, onPress }: EventCardProps) {
  const barColor = event.category?.color ?? Colors.vivid;

  return (
    <TouchableOpacity
      style={[ecStyles.container, !isLast && ecStyles.border]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[ecStyles.bar, { backgroundColor: barColor }]} />
      <View style={ecStyles.content}>
        <Text style={ecStyles.time}>{formatEventTime(event)}</Text>
        <Text style={ecStyles.title} numberOfLines={1}>
          {event.title}
        </Text>
        {!!event.location && (
          <View style={ecStyles.locationRow}>
            <MapPin size={11} color={Colors.muted} />
            <Text style={ecStyles.location} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const ecStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceSolid,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  bar: {
    width: 3,
    height: '100%',
    minHeight: 36,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  time: {
    ...Typography.meta,
    color: Colors.muted,
    marginBottom: 2,
  },
  title: {
    ...Typography.bodyStrong,
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  location: {
    ...Typography.meta,
    color: Colors.muted,
    flex: 1,
  },
});

// ─── EventDetailSheet ──────────────────────────────────────────────────────────

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDeleted: () => void;
}

function EventDetailSheet({ event, onClose, onEdit, onDeleted }: EventDetailSheetProps) {
  const deleteEvent = useDeleteEvent();

  const handleDelete = () => {
    if (!event) return;
    Alert.alert('Eliminar evento', `¿Eliminar "${event.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteEvent.mutate(event.id, {
            onSuccess: () => {
              onDeleted();
              onClose();
            },
          });
        },
      },
    ]);
  };

  function formatDateRange(e: CalendarEvent): string {
    try {
      const start = parseISO(e.startDateTime);
      const end = parseISO(e.endDateTime);
      if (e.isAllDay) {
        return `${format(start, "d 'de' MMMM yyyy", { locale: es })} · Todo el día`;
      }
      return `${format(start, "d 'de' MMMM yyyy", { locale: es })} · ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`;
    } catch {
      return '';
    }
  }

  return (
    <Modal visible={!!event} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={sheetStyles.sheet}>
        {/* Header */}
        <View style={sheetStyles.header}>
          <Text style={sheetStyles.title} numberOfLines={2}>
            {event?.title}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={22} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Details */}
        {event && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={sheetStyles.row}>
              <Calendar size={16} color={Colors.muted} />
              <Text style={sheetStyles.rowText}>{formatDateRange(event)}</Text>
            </View>
            {!!event.location && (
              <View style={sheetStyles.row}>
                <MapPin size={16} color={Colors.muted} />
                <Text style={sheetStyles.rowText}>{event.location}</Text>
              </View>
            )}
            {!!event.description && (
              <View style={sheetStyles.row}>
                <AlignLeft size={16} color={Colors.muted} />
                <Text style={sheetStyles.rowText}>{event.description}</Text>
              </View>
            )}
            {event.category && (
              <View style={sheetStyles.row}>
                <View
                  style={[
                    sheetStyles.catDot,
                    { backgroundColor: event.category.color ?? Colors.vivid },
                  ]}
                />
                <Text style={sheetStyles.rowText}>{event.category.name}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={sheetStyles.footer}>
          <TouchableOpacity
            style={[sheetStyles.footerBtn, sheetStyles.editBtn]}
            onPress={() => {
              onClose();
              event && onEdit(event);
            }}
          >
            <Edit2 size={16} color="#fff" />
            <Text style={sheetStyles.editBtnText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sheetStyles.footerBtn, sheetStyles.deleteBtn]}
            onPress={handleDelete}
            disabled={deleteEvent.isPending}
          >
            {deleteEvent.isPending ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <Trash2 size={16} color="#ef4444" />
                <Text style={sheetStyles.deleteBtnText}>Eliminar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl,
    paddingBottom: 36,
    maxHeight: '65%',
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.displaySm,
    color: Colors.text,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rowText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  catDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    gap: 6,
  },
  editBtn: {
    backgroundColor: Colors.vivid,
  },
  editBtnText: {
    ...Typography.bodyStrong,
    color: '#fff',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteBtnText: {
    ...Typography.bodyStrong,
    color: '#ef4444',
  },
});

// ─── EventFormModal ────────────────────────────────────────────────────────────

interface EventFormModalProps {
  visible: boolean;
  initialDate: Date;
  editingEvent?: CalendarEvent | null;
  onClose: () => void;
}

type DatePickerMode = 'date' | 'time';
type DatePickerField = 'startDate' | 'startTime' | 'endDate' | 'endTime';

function EventFormModal({ visible, initialDate, editingEvent, onClose }: EventFormModalProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: categories = [] } = useEventCategories();

  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // DateTimePicker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<DatePickerMode>('date');
  const [pickerField, setPickerField] = useState<DatePickerField>('startDate');

  // Populate form when editing
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setIsAllDay(editingEvent.isAllDay);
      setStartDate(parseISO(editingEvent.startDateTime));
      setEndDate(parseISO(editingEvent.endDateTime));
      setCategoryId(editingEvent.categoryId ?? '');
      setDescription(editingEvent.description ?? '');
      setLocation(editingEvent.location ?? '');
    } else {
      setTitle('');
      setIsAllDay(false);
      setStartDate(initialDate);
      const endDefault = new Date(initialDate);
      endDefault.setHours(initialDate.getHours() + 1);
      setEndDate(endDefault);
      setCategoryId(categories[0]?.id ?? '');
      setDescription('');
      setLocation('');
    }
  }, [visible, editingEvent, initialDate]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  function openPicker(field: DatePickerField, mode: DatePickerMode) {
    setPickerField(field);
    setPickerMode(mode);
    setPickerVisible(true);
  }

  function onPickerChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setPickerVisible(false);
    if (!date) return;

    if (pickerField === 'startDate') {
      const updated = new Date(startDate);
      updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setStartDate(updated);
    } else if (pickerField === 'startTime') {
      const updated = new Date(startDate);
      updated.setHours(date.getHours(), date.getMinutes());
      setStartDate(updated);
    } else if (pickerField === 'endDate') {
      const updated = new Date(endDate);
      updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setEndDate(updated);
    } else if (pickerField === 'endTime') {
      const updated = new Date(endDate);
      updated.setHours(date.getHours(), date.getMinutes());
      setEndDate(updated);
    }
  }

  function pickerValue(): Date {
    switch (pickerField) {
      case 'startDate':
      case 'startTime':
        return startDate;
      case 'endDate':
      case 'endTime':
        return endDate;
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Falta el título', 'Por favor ingresá un título para el evento.');
      return;
    }
    const dto: CreateEventDTO = {
      title: title.trim(),
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      isAllDay,
      categoryId,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
    };

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, dto }, { onSuccess: onClose });
    } else {
      createEvent.mutate(dto, { onSuccess: onClose });
    }
  }

  const isSaving = createEvent.isPending || updateEvent.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={formStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={formStyles.avoidingView}
      >
        <View style={formStyles.sheet}>
          {/* Header */}
          <View style={formStyles.header}>
            <Text style={formStyles.headerTitle}>
              {editingEvent ? 'Editar evento' : 'Nuevo evento'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <TextInput
              style={formStyles.titleInput}
              placeholder="Título del evento"
              placeholderTextColor={Colors.muted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            {/* All day toggle */}
            <View style={formStyles.row}>
              <Text style={formStyles.label}>Todo el día</Text>
              <Switch
                value={isAllDay}
                onValueChange={setIsAllDay}
                trackColor={{ false: Colors.line, true: Colors.vivid }}
                thumbColor="#fff"
              />
            </View>

            {/* Start */}
            <Text style={formStyles.sectionLabel}>Inicio</Text>
            <View style={formStyles.dateRow}>
              <TouchableOpacity
                style={formStyles.datePill}
                onPress={() => openPicker('startDate', 'date')}
              >
                <Text style={formStyles.datePillText}>
                  {format(startDate, 'd MMM yyyy', { locale: es })}
                </Text>
              </TouchableOpacity>
              {!isAllDay && (
                <TouchableOpacity
                  style={formStyles.datePill}
                  onPress={() => openPicker('startTime', 'time')}
                >
                  <Text style={formStyles.datePillText}>{format(startDate, 'HH:mm')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* End */}
            <Text style={formStyles.sectionLabel}>Fin</Text>
            <View style={formStyles.dateRow}>
              <TouchableOpacity
                style={formStyles.datePill}
                onPress={() => openPicker('endDate', 'date')}
              >
                <Text style={formStyles.datePillText}>
                  {format(endDate, 'd MMM yyyy', { locale: es })}
                </Text>
              </TouchableOpacity>
              {!isAllDay && (
                <TouchableOpacity
                  style={formStyles.datePill}
                  onPress={() => openPicker('endTime', 'time')}
                >
                  <Text style={formStyles.datePillText}>{format(endDate, 'HH:mm')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Categories */}
            {categories.length > 0 && (
              <>
                <Text style={formStyles.sectionLabel}>Categoría</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={formStyles.chipScroll}
                >
                  {categories.map((cat: EventCategory) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        formStyles.chip,
                        categoryId === cat.id && {
                          backgroundColor: cat.color ?? Colors.vivid,
                          borderColor: cat.color ?? Colors.vivid,
                        },
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text
                        style={[formStyles.chipText, categoryId === cat.id && { color: '#fff' }]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Description */}
            <Text style={formStyles.sectionLabel}>Descripción</Text>
            <TextInput
              style={[formStyles.input, formStyles.multiline]}
              placeholder="Descripción (opcional)"
              placeholderTextColor={Colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Location */}
            <Text style={formStyles.sectionLabel}>Ubicación</Text>
            <TextInput
              style={formStyles.input}
              placeholder="Ubicación (opcional)"
              placeholderTextColor={Colors.muted}
              value={location}
              onChangeText={setLocation}
            />
          </ScrollView>

          {/* Save button */}
          <TouchableOpacity
            style={[formStyles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={formStyles.saveBtnText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* DateTimePicker */}
      {pickerVisible && (
        <DateTimePicker
          value={pickerValue()}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onPickerChange}
        />
      )}
    </Modal>
  );
}

const formStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  avoidingView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl,
    paddingBottom: 36,
    maxHeight: '85%',
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.bodyLg,
    color: Colors.text,
  },
  titleInput: {
    ...Typography.bodyLg,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  label: {
    ...Typography.body,
    color: Colors.text,
  },
  sectionLabel: {
    ...Typography.meta,
    color: Colors.muted,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  datePill: {
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  datePillText: {
    ...Typography.caption,
    color: Colors.text,
  },
  chipScroll: {
    marginBottom: Spacing.xs,
  },
  chip: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bgTop,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.text,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.bgTop,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.cta,
  },
  saveBtnText: {
    ...Typography.bodyStrong,
    color: '#fff',
  },
});

// ─── AgendaScreen ─────────────────────────────────────────────────────────────

export default function AgendaScreen() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthFrom = startOfMonth(currentMonth).toISOString();
  const monthTo = endOfMonth(addMonths(currentMonth, 1)).toISOString();
  const { data: events = [], isLoading, refetch } = useCalendarEvents(monthFrom, monthTo);

  const sections = useMemo(() => groupEventsByDay(events), [events]);
  const daysWithEvents = useMemo(
    () => new Set(events.map((e: CalendarEvent) => e.startDateTime.slice(0, 10))),
    [events]
  );

  const listRef = useRef<SectionList<CalendarEvent>>(null);

  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formInitialDate, setFormInitialDate] = useState(new Date());

  const scrollToDate = useCallback(
    (date: Date) => {
      const key = format(date, 'yyyy-MM-dd');
      const idx = sections.findIndex((s) => s.dateKey === key);
      if (idx >= 0 && listRef.current) {
        listRef.current.scrollToLocation({
          sectionIndex: idx,
          itemIndex: 0,
          animated: true,
          viewOffset: 0,
        });
      }
    },
    [sections]
  );

  useEffect(() => {
    scrollToDate(selectedDate);
  }, [selectedDate]);

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
  }

  function handlePrevMonth() {
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
  }

  function handleNextMonth() {
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);
  }

  function openNewEvent() {
    setEditingEvent(null);
    setFormInitialDate(selectedDate);
    setShowForm(true);
  }

  function openEditEvent(event: CalendarEvent) {
    setEditingEvent(event);
    setShowForm(true);
  }

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.fab}
            onPress={openNewEvent}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Mini Calendar ─── */}
      <MiniCalendar
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        daysWithEvents={daysWithEvents}
        onSelectDate={handleSelectDate}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {/* ─── Event List ─── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.vivid} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Calendar size={40} color={Colors.muted} />
          <Text style={styles.emptyText}>Sin eventos en este período</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openNewEvent}>
            <Text style={styles.emptyBtnText}>Crear evento</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          ref={listRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={() => {
            setTimeout(() => {
              const key = format(selectedDate, 'yyyy-MM-dd');
              const idx = sections.findIndex((s) => s.dateKey === key);
              if (idx >= 0 && listRef.current) {
                listRef.current.scrollToLocation({
                  sectionIndex: idx,
                  itemIndex: 0,
                  animated: true,
                });
              }
            }, 300);
          }}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>
                {capitalize(formatSectionHeader(section.dateKey))}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <EventCard
              event={item}
              isLast={index === section.data.length - 1}
              onPress={() => setDetailEvent(item)}
            />
          )}
          renderSectionFooter={() => <View style={styles.sectionGap} />}
        />
      )}

      {/* ─── Modals ─── */}
      <EventDetailSheet
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={(ev) => openEditEvent(ev)}
        onDeleted={() => setDetailEvent(null)}
      />
      <EventFormModal
        visible={showForm}
        initialDate={formInitialDate}
        editingEvent={editingEvent}
        onClose={() => {
          setShowForm(false);
          setEditingEvent(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgTop,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceSolid,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerTitle: {
    ...Typography.displaySm,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.vivid,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.cta,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  sectionHeaderText: {
    ...Typography.caption,
    color: Colors.muted,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sectionGap: {
    height: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.muted,
  },
  emptyBtn: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  emptyBtnText: {
    ...Typography.bodyStrong,
    color: '#fff',
  },
});
