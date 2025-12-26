/**
 * CreateResourceScreen
 * Fase 3 - Mobile Implementation
 * Screen for creating and editing resources
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResourceType } from '@horus/shared';
import { useCreateResource, useUpdateResource, useResource } from '../hooks/useResources';
import { NoteEditor } from '../components/resources/NoteEditor';
import { SnippetEditor } from '../components/resources/SnippetEditor';
import { BookmarkForm } from '../components/resources/BookmarkForm';

type NavigationProp = NativeStackNavigationProp<any>;

const TYPE_OPTIONS = [
  { value: ResourceType.NOTE, label: 'Nota', icon: '📝' },
  { value: ResourceType.SNIPPET, label: 'Código', icon: '💻' },
  { value: ResourceType.BOOKMARK, label: 'Enlace', icon: '🔖' },
];

const COLORS = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
];

export function CreateResourceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const resourceId = route.params?.resourceId;
  const isEditMode = !!resourceId;

  const { data: existingResource } = useResource(resourceId || '');
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();

  const [type, setType] = useState<ResourceType>(ResourceType.NOTE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState<string | undefined>();
  const [tagInput, setTagInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Load existing resource data if editing
  useEffect(() => {
    if (existingResource) {
      setType(existingResource.type);
      setTitle(existingResource.title);
      setDescription(existingResource.description || '');
      setContent(existingResource.content || '');
      setUrl(existingResource.url || '');
      setLanguage(existingResource.language || 'javascript');
      setTags(existingResource.tags);
      setColor(existingResource.color || undefined);
    }
  }, [existingResource]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    // Validación básica
    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    if (type === ResourceType.NOTE && !content.trim()) {
      Alert.alert('Error', 'El contenido es requerido para notas');
      return;
    }

    if (type === ResourceType.SNIPPET && !content.trim()) {
      Alert.alert('Error', 'El código es requerido para snippets');
      return;
    }

    if (type === ResourceType.BOOKMARK && !url.trim()) {
      Alert.alert('Error', 'La URL es requerida para bookmarks');
      return;
    }

    const resourceData = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      content: content.trim() || undefined,
      url: url.trim() || undefined,
      language: type === ResourceType.SNIPPET ? language : undefined,
      tags,
      color,
    };

    if (isEditMode) {
      updateMutation.mutate(
        { id: resourceId, data: resourceData },
        {
          onSuccess: () => {
            navigation.goBack();
          },
        }
      );
    } else {
      createMutation.mutate(resourceData, {
        onSuccess: () => {
          navigation.goBack();
        },
      });
    }
  };

  const renderContentEditor = () => {
    switch (type) {
      case ResourceType.NOTE:
        return <NoteEditor value={content} onChange={setContent} />;

      case ResourceType.SNIPPET:
        return (
          <SnippetEditor
            code={content}
            language={language}
            onCodeChange={setContent}
            onLanguageChange={setLanguage}
          />
        );

      case ResourceType.BOOKMARK:
        return <BookmarkForm url={url} onUrlChange={setUrl} />;

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Editar Resource' : 'Nuevo Resource'}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          <Text style={styles.saveButton}>
            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Type selector */}
        {!isEditMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Resource</Text>
            <View style={styles.typeSelector}>
              {TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeOption,
                    type === option.value && styles.typeOptionActive,
                  ]}
                  onPress={() => setType(option.value)}
                >
                  <Text style={styles.typeIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      type === option.value && styles.typeLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Título del recurso"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción opcional"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Content Editor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {type === ResourceType.NOTE && 'Contenido (Markdown)'}
            {type === ResourceType.SNIPPET && 'Código'}
            {type === ResourceType.BOOKMARK && 'URL'}
          </Text>
          {renderContentEditor()}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Agregar tag"
              placeholderTextColor="#999"
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
              <Text style={styles.addTagButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                  <Text style={styles.tagRemove}>✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={styles.label}>Color (opcional)</Text>
          <TouchableOpacity
            style={styles.colorButton}
            onPress={() => setShowColorPicker(true)}
          >
            {color ? (
              <View style={[styles.colorPreview, { backgroundColor: color }]} />
            ) : (
              <View style={styles.colorPreviewEmpty} />
            )}
            <Text style={styles.colorButtonText}>
              {color ? 'Cambiar color' : 'Seleccionar color'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Color</Text>
            <View style={styles.colorsGrid}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorCircle, { backgroundColor: c }]}
                  onPress={() => {
                    setColor(c);
                    setShowColorPicker(false);
                  }}
                >
                  {color === c && <Text style={styles.colorCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
            {color && (
              <TouchableOpacity
                style={styles.clearColorButton}
                onPress={() => {
                  setColor(undefined);
                  setShowColorPicker(false);
                }}
              >
                <Text style={styles.clearColorText}>Quitar color</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  typeOptionActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  typeLabelActive: {
    color: '#2196F3',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '300',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  tagRemove: {
    fontSize: 14,
    color: '#2196F3',
  },
  colorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorPreviewEmpty: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  colorButtonText: {
    fontSize: 15,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheck: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  clearColorButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearColorText: {
    fontSize: 15,
    color: '#F44336',
    fontWeight: '500',
  },
});
