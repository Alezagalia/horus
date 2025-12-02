/**
 * CategoryFormModal Component
 * Sprint 2 - US-016
 *
 * Modal for creating and editing categories with emoji and color pickers
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Scope, SCOPE_LABELS, type Category, type CreateCategoryDTO } from '@horus/shared';
import { EmojiPicker } from '../common/EmojiPicker';
import { ColorPicker } from '../common/ColorPicker';

interface CategoryFormModalProps {
  visible: boolean;
  category?: Category | null; // null for create, Category for edit
  scope?: Scope; // Required for create mode
  onClose: () => void;
  onSubmit: (data: CreateCategoryDTO & { id?: string }) => void;
  isLoading?: boolean;
}

export const CategoryFormModal = ({
  visible,
  category,
  scope,
  onClose,
  onSubmit,
  isLoading = false,
}: CategoryFormModalProps) => {
  const isEditMode = !!category;

  // Form state
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('📁');
  const [selectedColor, setSelectedColor] = useState<string>('#2196F3');
  const [selectedScope, setSelectedScope] = useState<Scope>(scope || Scope.HABITOS);
  const [nameError, setNameError] = useState<string>('');

  // Initialize form with category data in edit mode
  useEffect(() => {
    if (category) {
      setName(category.name);
      setSelectedEmoji(category.icon || '📁');
      setSelectedColor(category.color || '#2196F3');
      setSelectedScope(category.scope);
    } else if (scope) {
      setSelectedScope(scope);
    }
  }, [category, scope]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setName('');
        setSelectedEmoji('📁');
        setSelectedColor('#2196F3');
        setNameError('');
      }, 300); // Wait for modal animation
    }
  }, [visible]);

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('El nombre es requerido');
      return false;
    }
    if (value.length > 50) {
      setNameError('El nombre no puede exceder 50 caracteres');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = () => {
    if (!validateName(name)) return;

    const data: CreateCategoryDTO & { id?: string } = {
      name: name.trim(),
      scope: selectedScope,
      icon: selectedEmoji,
      color: selectedColor,
    };

    if (isEditMode && category) {
      data.id = category.id;
    }

    onSubmit(data);
  };

  const handleCancel = () => {
    setNameError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{isEditMode ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.sectionTitle}>Vista Previa</Text>
              <View style={[styles.previewCard, { borderLeftColor: selectedColor }]}>
                <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
                <Text style={styles.previewName}>{name || 'Nombre de la categoría'}</Text>
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nombre *</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) validateName(text);
                }}
                placeholder="Ej: Trabajo, Salud, Compras..."
                maxLength={50}
                autoCapitalize="sentences"
                editable={!isLoading}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              <Text style={styles.helperText}>{name.length}/50 caracteres</Text>
            </View>

            {/* Scope (only in create mode) */}
            {!isEditMode && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tipo *</Text>
                <View style={styles.scopeButtons}>
                  {Object.values(Scope).map((scopeValue) => (
                    <TouchableOpacity
                      key={scopeValue}
                      style={[
                        styles.scopeButton,
                        selectedScope === scopeValue && styles.scopeButtonSelected,
                      ]}
                      onPress={() => setSelectedScope(scopeValue)}
                      disabled={isLoading}
                    >
                      <Text
                        style={[
                          styles.scopeButtonText,
                          selectedScope === scopeValue && styles.scopeButtonTextSelected,
                        ]}
                      >
                        {SCOPE_LABELS[scopeValue]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Emoji Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ícono</Text>
              <EmojiPicker selectedEmoji={selectedEmoji} onSelect={setSelectedEmoji} />
            </View>

            {/* Color Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color</Text>
              <ColorPicker selectedColor={selectedColor} onSelect={setSelectedColor} />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{isEditMode ? 'Actualizar' : 'Crear'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  previewEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  scopeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scopeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scopeButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  scopeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scopeButtonTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
