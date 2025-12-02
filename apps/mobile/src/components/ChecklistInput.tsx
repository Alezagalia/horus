/**
 * ChecklistInput Component
 * Sprint 7 - US-063
 *
 * Input para agregar nuevos items al checklist
 */

import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChecklistInputProps {
  onAdd: (title: string) => Promise<void>;
  placeholder?: string;
}

export const ChecklistInput: React.FC<ChecklistInputProps> = ({
  onAdd,
  placeholder = 'Agregar item...',
}) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedValue = value.trim();
    if (!trimmedValue || loading) return;

    try {
      setLoading(true);
      await onAdd(trimmedValue);
      setValue('');
    } catch (error) {
      console.error('Error adding checklist item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="add-circle-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          blurOnSubmit={false}
          editable={!loading}
        />
        {value.trim().length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : (
              <Ionicons name="send" size={20} color="#2196F3" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 4,
  },
  addButton: {
    padding: 4,
    marginLeft: 8,
  },
});
