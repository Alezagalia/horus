import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  Search,
  Pin,
  Trash2,
  Plus,
  FileText,
  Code2,
  Bookmark,
  ArrowLeft,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadows } from '@/tokens';
import {
  useResources,
  useCreateResource,
  useDeleteResource,
  useTogglePinResource,
  resourceKeys,
} from '@/hooks/useResources';
import type { Resource, ResourceType, CreateResourceDTO } from '@/services/api/resourceApi';

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ResourceType,
  {
    label: string;
    Icon: typeof FileText;
    color: string;
    bg: string;
    placeholder: { title: string; content?: string; url?: string };
  }
> = {
  NOTE: {
    label: 'Nota',
    Icon: FileText,
    color: '#f59e0b',
    bg: '#fef3c7',
    placeholder: { title: 'Título de la nota...', content: 'Escribí tu nota aquí...' },
  },
  SNIPPET: {
    label: 'Snippet',
    Icon: Code2,
    color: Colors.vivid,
    bg: Colors.ice,
    placeholder: { title: 'Nombre del snippet...', content: 'Pegá tu código aquí...' },
  },
  BOOKMARK: {
    label: 'Bookmark',
    Icon: Bookmark,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    placeholder: { title: 'Título...', url: 'https://...' },
  },
};

const TYPE_FILTERS: Array<{ key: ResourceType | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'Todos' },
  { key: 'NOTE', label: 'Notas' },
  { key: 'SNIPPET', label: 'Snippets' },
  { key: 'BOOKMARK', label: 'Bookmarks' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatResourceDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM', { locale: es });
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  visible,
  onClose,
  initialType,
}: {
  visible: boolean;
  onClose: () => void;
  initialType?: ResourceType;
}) {
  const [step, setStep] = useState<'type' | 'form'>(initialType ? 'form' : 'type');
  const [type, setType] = useState<ResourceType>(initialType ?? 'NOTE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');

  const createResource = useCreateResource();
  const cfg = TYPE_CONFIG[type];

  const reset = () => {
    setStep(initialType ? 'form' : 'type');
    setType(initialType ?? 'NOTE');
    setTitle('');
    setContent('');
    setUrl('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    title.trim() !== '' && (type === 'BOOKMARK' ? url.trim() !== '' : content.trim() !== '');

  const handleSubmit = () => {
    if (!canSubmit) return;
    const dto: CreateResourceDTO = {
      type,
      title: title.trim(),
      ...(type !== 'BOOKMARK' && { content: content.trim() }),
      ...(type === 'BOOKMARK' && { url: url.trim() }),
      ...(type === 'SNIPPET' && { language: 'text' }),
    };
    createResource.mutate(dto, {
      onSuccess: handleClose,
      onError: () => Alert.alert('Error', 'No se pudo guardar el recurso'),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            {step === 'form' && !initialType ? (
              <TouchableOpacity
                onPress={() => setStep('type')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color={Colors.muted} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 20 }} />
            )}
            <Text style={styles.modalTitle}>
              {step === 'type' ? 'Nuevo recurso' : `Nueva ${cfg.label}`}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {step === 'type' ? (
            /* Type selector */
            <View style={styles.typeGrid}>
              {(Object.keys(TYPE_CONFIG) as ResourceType[]).map((t) => {
                const c = TYPE_CONFIG[t];
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeCard, { backgroundColor: c.bg }]}
                    onPress={() => {
                      setType(t);
                      setStep('form');
                    }}
                    activeOpacity={0.8}
                  >
                    <c.Icon size={28} color={c.color} strokeWidth={1.5} />
                    <Text style={[styles.typeCardLabel, { color: c.color }]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Form */
            <>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder={cfg.placeholder.title}
                placeholderTextColor={Colors.muted}
                autoFocus
                returnKeyType="next"
              />

              {type === 'BOOKMARK' ? (
                <TextInput
                  style={styles.urlInput}
                  value={url}
                  onChangeText={setUrl}
                  placeholder={cfg.placeholder.url}
                  placeholderTextColor={Colors.muted}
                  keyboardType="url"
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              ) : (
                <TextInput
                  style={styles.contentInput}
                  value={content}
                  onChangeText={setContent}
                  placeholder={cfg.placeholder.content}
                  placeholderTextColor={Colors.muted}
                  multiline
                  textAlignVertical="top"
                />
              )}

              <Button
                label="Guardar"
                onPress={handleSubmit}
                loading={createResource.isPending}
                disabled={!canSubmit}
                style={{ marginTop: Spacing.md }}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Resource card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  onDelete,
  onPin,
  deleting,
  pinning,
}: {
  resource: Resource;
  onDelete: () => void;
  onPin: () => void;
  deleting: boolean;
  pinning: boolean;
}) {
  const cfg = TYPE_CONFIG[resource.type];

  const handleDelete = () => {
    Alert.alert('Eliminar recurso', `¿Eliminar "${resource.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  };

  const handleOpen = () => {
    if (resource.url) {
      Linking.openURL(resource.url).catch(() => Alert.alert('Error', 'No se pudo abrir el enlace'));
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={resource.url ? 0.75 : 1}
      onPress={resource.url ? handleOpen : undefined}
    >
      <Card solid style={styles.resourceCard}>
        <View style={styles.resourceHeader}>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <cfg.Icon size={13} color={cfg.color} strokeWidth={2} />
            <Text style={[styles.typeBadgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          <View style={styles.resourceActions}>
            {/* Pin */}
            <TouchableOpacity
              onPress={onPin}
              disabled={pinning}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {pinning ? (
                <ActivityIndicator size="small" color={Colors.muted} />
              ) : (
                <Pin
                  size={15}
                  color={resource.isPinned ? Colors.vivid : Colors.muted}
                  strokeWidth={2}
                  fill={resource.isPinned ? Colors.vivid : 'none'}
                />
              )}
            </TouchableOpacity>
            {/* Delete */}
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={Colors.muted} />
              ) : (
                <Trash2 size={15} color={Colors.muted} strokeWidth={1.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.resourceTitle} numberOfLines={2}>
          {resource.title}
        </Text>

        {resource.description && (
          <Text style={styles.resourceDesc} numberOfLines={2}>
            {resource.description}
          </Text>
        )}
        {resource.url && (
          <Text style={styles.resourceUrl} numberOfLines={1}>
            {resource.url}
          </Text>
        )}
        {resource.content && resource.type !== 'SNIPPET' && (
          <Text style={styles.resourceContent} numberOfLines={3}>
            {resource.content}
          </Text>
        )}
        {resource.content && resource.type === 'SNIPPET' && (
          <View style={styles.snippetBlock}>
            <Text style={styles.snippetText} numberOfLines={4}>
              {resource.content}
            </Text>
          </View>
        )}

        <View style={styles.resourceFooter}>
          {resource.tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {resource.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <Text style={styles.resourceDate}>{formatResourceDate(resource.updatedAt)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function RecursosScreen() {
  const params = useLocalSearchParams<{ create?: string }>();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(params.create === '1');

  const queryClient = useQueryClient();

  const filters = {
    ...(typeFilter !== 'ALL' && { type: typeFilter }),
    ...(search.trim() && { search: search.trim() }),
  };

  const {
    data: resources = [],
    isLoading,
    isFetching,
  } = useResources(Object.keys(filters).length > 0 ? filters : undefined);

  const deleteResource = useDeleteResource();
  const pinResource = useTogglePinResource();

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: resourceKeys.all });
  }, [queryClient]);

  const pinned = resources.filter((r) => r.isPinned);
  const unpinned = resources.filter((r) => !r.isPinned);
  const ordered = [...pinned, ...unpinned];

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer onRefresh={onRefresh} refreshing={isFetching && !isLoading}>
        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Recursos</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.muted} strokeWidth={1.5} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar recursos..."
            placeholderTextColor={Colors.muted}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Type filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.screenX }}
          style={{ marginBottom: Spacing.lg }}
        >
          {TYPE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, typeFilter === f.key && styles.filterChipActive]}
              onPress={() => setTypeFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipLabel,
                  { color: typeFilter === f.key ? '#fff' : Colors.ink },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {isLoading ? (
          <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 32 }} />
        ) : ordered.length === 0 ? (
          <Card solid style={styles.emptyCard}>
            <FileText size={36} color={Colors.ceilLight} strokeWidth={1} />
            <Text style={styles.emptyTitle}>{search ? 'Sin resultados' : 'Sin recursos'}</Text>
            <Text style={styles.emptySub}>
              {search ? 'Probá con otras palabras' : 'Guardá notas, snippets y bookmarks'}
            </Text>
          </Card>
        ) : (
          ordered.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onDelete={() => deleteResource.mutate(r.id)}
              onPin={() => pinResource.mutate(r.id)}
              deleting={deleteResource.isPending && deleteResource.variables === r.id}
              pinning={pinResource.isPending && pinResource.variables === r.id}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScreenContainer>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
        <Plus size={24} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

      <CreateModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  screenTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.md,
    ...Shadows.account,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.ink,
  },

  // Filter chips
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSolid,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  filterChipActive: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
    ...Shadows.cta,
  },
  filterChipLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },

  // Resource card
  resourceCard: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  typeBadgeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  resourceActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  resourceTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    lineHeight: 20,
  },
  resourceDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  resourceUrl: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.vivid,
  },
  resourceContent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  snippetBlock: {
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.vivid,
  },
  snippetText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.ink,
    lineHeight: 18,
  },
  resourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.ice,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.ceilDark,
  },
  resourceDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginLeft: Spacing.sm,
    flexShrink: 0,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing['2xl'],
    width: 52,
    height: 52,
    borderRadius: Radius.fab,
    backgroundColor: Colors.vivid,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },

  // Empty
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,14,31,0.5)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.xl,
  },
  typeCardLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  titleInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.ice,
    marginBottom: Spacing.md,
  },
  urlInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.vivid,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    marginBottom: Spacing.md,
  },
  contentInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    height: 120,
    marginBottom: Spacing.md,
  },
});
