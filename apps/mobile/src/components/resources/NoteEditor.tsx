/**
 * NoteEditor Component
 * Fase 3 - Mobile Implementation
 * Markdown editor with preview for notes
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NoteEditor({ value, onChange, placeholder }: NoteEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !showPreview && styles.tabActive]}
          onPress={() => setShowPreview(false)}
        >
          <Text style={[styles.tabText, !showPreview && styles.tabTextActive]}>
            ✏️ Editar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showPreview && styles.tabActive]}
          onPress={() => setShowPreview(true)}
        >
          <Text style={[styles.tabText, showPreview && styles.tabTextActive]}>
            👁️ Vista Previa
          </Text>
        </TouchableOpacity>
      </View>

      {/* Editor / Preview */}
      {showPreview ? (
        <ScrollView style={styles.preview}>
          {value ? (
            <Markdown style={markdownStyles}>{value}</Markdown>
          ) : (
            <Text style={styles.emptyText}>Sin contenido para previsualizar</Text>
          )}
        </ScrollView>
      ) : (
        <TextInput
          style={styles.editor}
          value={value}
          onChangeText={onChange}
          placeholder={
            placeholder ||
            'Escribe tu nota en Markdown...\n\n# Título\n## Subtítulo\n\n**Negrita** *Cursiva*\n\n- Lista\n- Item 2'
          }
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          autoCorrect={false}
          spellCheck={false}
        />
      )}

      {/* Helper text */}
      <View style={styles.footer}>
        <Text style={styles.helperText}>
          Soporta Markdown: **negrita**, *cursiva*, # títulos, - listas
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  editor: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
    minHeight: 300,
  },
  preview: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    minHeight: 300,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  footer: {
    paddingTop: 8,
  },
  helperText: {
    fontSize: 11,
    color: '#666',
  },
});

const markdownStyles: any = {
  body: {
    fontSize: 14,
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#E0E0E0',
    fontFamily: 'monospace',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  code_block: {
    backgroundColor: '#2D2D2D',
    color: '#F8F8F2',
    fontFamily: 'monospace',
    padding: 12,
    borderRadius: 6,
  },
  fence: {
    backgroundColor: '#2D2D2D',
    color: '#F8F8F2',
    fontFamily: 'monospace',
    padding: 12,
    borderRadius: 6,
  },
  bullet_list: {
    marginLeft: 8,
  },
  ordered_list: {
    marginLeft: 8,
  },
  list_item: {
    marginBottom: 4,
  },
};
