/**
 * BookmarkForm Component
 * Fase 3 - Mobile Implementation
 * Form for adding bookmarks/URLs
 */

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Linking, TouchableOpacity } from 'react-native';

interface BookmarkFormProps {
  url: string;
  onUrlChange: (url: string) => void;
}

export function BookmarkForm({ url, onUrlChange }: BookmarkFormProps) {
  const [isValidUrl, setIsValidUrl] = useState(false);

  const validateUrl = (text: string) => {
    onUrlChange(text);

    if (!text) {
      setIsValidUrl(false);
      return;
    }

    try {
      new URL(text);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(false);
    }
  };

  const handleOpenUrl = () => {
    if (isValidUrl && url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>URL *</Text>
      <TextInput
        style={[styles.input, isValidUrl && styles.inputValid, url && !isValidUrl && styles.inputInvalid]}
        value={url}
        onChangeText={validateUrl}
        placeholder="https://ejemplo.com"
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        keyboardType="url"
      />

      {url && !isValidUrl && (
        <Text style={styles.errorText}>URL inválida. Debe incluir http:// o https://</Text>
      )}

      {isValidUrl && (
        <View style={styles.preview}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>✅ URL válida</Text>
            <TouchableOpacity onPress={handleOpenUrl}>
              <Text style={styles.openLink}>Abrir 🔗</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.previewUrl} numberOfLines={2}>
            {url}
          </Text>
        </View>
      )}

      <Text style={styles.helperText}>
        Ingresa la URL completa incluyendo https://
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  inputValid: {
    borderColor: '#4CAF50',
  },
  inputInvalid: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  preview: {
    marginTop: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4CAF50',
  },
  openLink: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  previewUrl: {
    fontSize: 12,
    color: '#555',
  },
  helperText: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
  },
});
