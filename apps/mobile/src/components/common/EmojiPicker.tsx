/**
 * EmojiPicker Component
 * Sprint 2 - US-016
 *
 * Emoji picker with predefined emojis organized by categories
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface EmojiPickerProps {
  selectedEmoji?: string;
  onSelect: (emoji: string) => void;
}

// Predefined emojis organized by category
const EMOJI_CATEGORIES = [
  {
    name: 'Hábitos',
    emojis: ['🎯', '💪', '🏃', '🧘', '📚', '✍️', '🎨', '🎵', '🎮', '⚡'],
  },
  {
    name: 'Tareas',
    emojis: ['✅', '📝', '📋', '📌', '🎓', '💼', '🏠', '🛒', '📞', '💡'],
  },
  {
    name: 'Eventos',
    emojis: ['📅', '🎉', '🎂', '🎊', '🏆', '✈️', '🚗', '🍽️', '🎭', '🎬'],
  },
  {
    name: 'Gastos',
    emojis: ['💰', '💳', '🏦', '💵', '💸', '🛍️', '🍔', '☕', '🏥', '⛽'],
  },
  {
    name: 'General',
    emojis: ['📁', '🌟', '❤️', '🔥', '🌈', '☀️', '🌙', '⭐', '🎁', '🔔'],
  },
];

export const EmojiPicker = ({ selectedEmoji, onSelect }: EmojiPickerProps) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {EMOJI_CATEGORIES.map((category) => (
        <View key={category.name} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <View style={styles.emojiGrid}>
            {category.emojis.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.emojiButton, selectedEmoji === emoji && styles.emojiButtonSelected]}
                onPress={() => onSelect(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  emojiButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  emojiText: {
    fontSize: 28,
  },
});
