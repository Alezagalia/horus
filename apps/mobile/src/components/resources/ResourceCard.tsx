/**
 * ResourceCard Component
 * Fase 3 - Mobile Implementation
 * Card displaying resource information with type-specific previews
 */

import { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Resource, ResourceType } from '@horus/shared';
import Markdown from 'react-native-markdown-display';

interface ResourceCardProps {
  resource: Resource;
  onPress: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onTogglePin?: (resource: Resource) => void;
}

const TYPE_ICONS: Record<ResourceType, string> = {
  [ResourceType.NOTE]: '📝',
  [ResourceType.SNIPPET]: '💻',
  [ResourceType.BOOKMARK]: '🔖',
};

const TYPE_LABELS: Record<ResourceType, string> = {
  [ResourceType.NOTE]: 'Nota',
  [ResourceType.SNIPPET]: 'Código',
  [ResourceType.BOOKMARK]: 'Enlace',
};

const TYPE_COLORS: Record<ResourceType, string> = {
  [ResourceType.NOTE]: '#2196F3',
  [ResourceType.SNIPPET]: '#4CAF50',
  [ResourceType.BOOKMARK]: '#FF9800',
};

export const ResourceCard = memo(
  ({ resource, onPress, onDelete, onTogglePin }: ResourceCardProps) => {
    const typeColor = TYPE_COLORS[resource.type];
    const cardColor = resource.color || '#9E9E9E';

    const renderRightActions = (
      _progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>
    ) => {
      const scale = dragX.interpolate({
        inputRange: [-100, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      });

      return (
        <View style={styles.actionsContainer}>
          {onTogglePin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.pinAction]}
              onPress={() => onTogglePin(resource)}
              activeOpacity={0.7}
            >
              <Animated.Text style={[styles.actionText, { transform: [{ scale }] }]}>
                {resource.isPinned ? '📌' : '📍'}
              </Animated.Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteAction]}
              onPress={() => onDelete(resource)}
              activeOpacity={0.7}
            >
              <Animated.Text style={[styles.actionText, { transform: [{ scale }] }]}>
                🗑️
              </Animated.Text>
            </TouchableOpacity>
          )}
        </View>
      );
    };

    const renderContent = () => {
      switch (resource.type) {
        case ResourceType.NOTE:
          return resource.content ? (
            <View style={styles.notePreview}>
              <Markdown style={markdownStyles}>
                {resource.content.slice(0, 200)}
              </Markdown>
            </View>
          ) : null;

        case ResourceType.SNIPPET:
          return resource.content ? (
            <View style={styles.snippetPreview}>
              {resource.language && (
                <View style={styles.languageBadge}>
                  <Text style={styles.languageBadgeText}>{resource.language}</Text>
                </View>
              )}
              <Text style={styles.codeText} numberOfLines={6}>
                {resource.content.slice(0, 300)}
              </Text>
            </View>
          ) : null;

        case ResourceType.BOOKMARK:
          return resource.url ? (
            <TouchableOpacity
              style={styles.bookmarkPreview}
              onPress={() => resource.url && Linking.openURL(resource.url)}
            >
              <Text style={styles.urlText} numberOfLines={2}>
                {resource.url}
              </Text>
              <Text style={styles.openIcon}>🔗</Text>
            </TouchableOpacity>
          ) : null;

        default:
          return null;
      }
    };

    return (
      <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
        <TouchableOpacity
          style={[styles.card, { borderLeftColor: cardColor }]}
          onPress={() => onPress(resource)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.typeIcon}>{TYPE_ICONS[resource.type]}</Text>
              <View style={styles.headerInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {resource.title}
                  </Text>
                  {resource.isPinned && <Text style={styles.pinIcon}>📌</Text>}
                </View>
                <Text style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                  {TYPE_LABELS[resource.type]}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {resource.description && (
            <Text style={styles.description} numberOfLines={2}>
              {resource.description}
            </Text>
          )}

          {/* Content Preview */}
          {renderContent()}

          {/* Tags */}
          {resource.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {resource.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
              {resource.tags.length > 3 && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>+{resource.tags.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  pinIcon: {
    fontSize: 14,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFF',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  notePreview: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  snippetPreview: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    position: 'relative',
  },
  languageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#424242',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  languageBadgeText: {
    fontSize: 10,
    color: '#AAA',
    fontWeight: '500',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#F8F8F2',
    lineHeight: 16,
  },
  bookmarkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: '#2196F3',
    marginRight: 8,
  },
  openIcon: {
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    borderRadius: 12,
    marginLeft: 6,
  },
  pinAction: {
    backgroundColor: '#FF9800',
  },
  deleteAction: {
    backgroundColor: '#F44336',
  },
  actionText: {
    fontSize: 24,
  },
});

const markdownStyles: any = {
  body: {
    fontSize: 13,
    color: '#333',
  },
  heading1: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heading2: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
};
