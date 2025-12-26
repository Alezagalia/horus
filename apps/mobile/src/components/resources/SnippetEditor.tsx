/**
 * SnippetEditor Component
 * Fase 3 - Mobile Implementation
 * Code snippet editor with language selector
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';

interface SnippetEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: 'Texto plano' },
];

export function SnippetEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
}: SnippetEditorProps) {
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const selectedLanguageLabel =
    LANGUAGES.find((lang) => lang.value === language)?.label || 'Seleccionar';

  const lineCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <View style={styles.container}>
      {/* Language selector */}
      <View style={styles.header}>
        <Text style={styles.label}>Lenguaje:</Text>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguagePicker(true)}
        >
          <Text style={styles.languageButtonText}>{selectedLanguageLabel}</Text>
          <Text style={styles.languageButtonIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Code editor */}
      <TextInput
        style={styles.editor}
        value={code}
        onChangeText={onCodeChange}
        placeholder="Pega tu código aquí..."
        placeholderTextColor="#666"
        multiline
        textAlignVertical="top"
        autoCorrect={false}
        spellCheck={false}
        autoCapitalize="none"
      />

      {/* Info */}
      <View style={styles.footer}>
        <Text style={styles.infoText}>
          Líneas: {lineCount} | Caracteres: {charCount}
        </Text>
      </View>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Lenguaje</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[
                    styles.languageItem,
                    language === lang.value && styles.languageItemActive,
                  ]}
                  onPress={() => {
                    onLanguageChange(lang.value);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      language === lang.value && styles.languageItemTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {language === lang.value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languageButtonText: {
    fontSize: 14,
    color: '#333',
  },
  languageButtonIcon: {
    fontSize: 10,
    color: '#666',
  },
  editor: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#F8F8F2',
    minHeight: 300,
  },
  footer: {
    paddingTop: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  languageList: {
    padding: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  languageItemActive: {
    backgroundColor: '#E3F2FD',
  },
  languageItemText: {
    fontSize: 15,
    color: '#333',
  },
  languageItemTextActive: {
    color: '#2196F3',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});
