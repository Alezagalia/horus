/**
 * ResourceDetailScreen
 * Fase 3 - Mobile Implementation
 * Screen for viewing resource details with full content
 */

import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResourceType } from '@horus/shared';
import {
  useResource,
  useDeleteResource,
  useTogglePin,
} from '../hooks/useResources';
import Markdown from 'react-native-markdown-display';

type NavigationProp = NativeStackNavigationProp<any>;

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

export function ResourceDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const resourceId = route.params?.resourceId;

  const { data: resource, isLoading, refetch } = useResource(resourceId);
  const deleteMutation = useDeleteResource();
  const togglePinMutation = useTogglePin();

  // Refetch on focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleEdit = () => {
    navigation.navigate('CreateResource', { resourceId });
  };

  const handleDelete = () => {
    if (!resource) return;

    Alert.alert(
      'Eliminar Resource',
      `¿Estás seguro de que quieres eliminar "${resource.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(resourceId, {
              onSuccess: () => {
                navigation.goBack();
              },
            });
          },
        },
      ]
    );
  };

  const handleTogglePin = () => {
    togglePinMutation.mutate(resourceId);
  };

  const handleShare = async () => {
    if (!resource) return;

    try {
      let message = `${resource.title}\n\n`;

      if (resource.description) {
        message += `${resource.description}\n\n`;
      }

      if (resource.type === ResourceType.NOTE && resource.content) {
        message += resource.content;
      } else if (resource.type === ResourceType.SNIPPET && resource.content) {
        message += `Código (${resource.language}):\n\n${resource.content}`;
      } else if (resource.type === ResourceType.BOOKMARK && resource.url) {
        message += resource.url;
      }

      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopy = async () => {
    if (!resource) return;

    let textToCopy = '';

    if (resource.type === ResourceType.NOTE && resource.content) {
      textToCopy = resource.content;
    } else if (resource.type === ResourceType.SNIPPET && resource.content) {
      textToCopy = resource.content;
    } else if (resource.type === ResourceType.BOOKMARK && resource.url) {
      textToCopy = resource.url;
    }

    // En React Native no hay clipboard API nativa simple, pero mostramos un alert
    Alert.alert('Contenido', textToCopy, [
      { text: 'OK' },
      {
        text: 'Compartir',
        onPress: handleShare,
      },
    ]);
  };

  const handleOpenUrl = () => {
    if (resource?.url) {
      Linking.openURL(resource.url);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando recurso...</Text>
      </View>
    );
  }

  if (!resource) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Resource no encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderContent = () => {
    switch (resource.type) {
      case ResourceType.NOTE:
        return resource.content ? (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Contenido</Text>
            <View style={styles.noteContent}>
              <Markdown style={markdownStyles}>{resource.content}</Markdown>
            </View>
          </View>
        ) : null;

      case ResourceType.SNIPPET:
        return resource.content ? (
          <View style={styles.contentSection}>
            <View style={styles.snippetHeader}>
              <Text style={styles.sectionTitle}>Código</Text>
              {resource.language && (
                <View style={styles.languageBadge}>
                  <Text style={styles.languageBadgeText}>{resource.language}</Text>
                </View>
              )}
            </View>
            <ScrollView horizontal style={styles.codeScroll}>
              <Text style={styles.codeText}>{resource.content}</Text>
            </ScrollView>
          </View>
        ) : null;

      case ResourceType.BOOKMARK:
        return resource.url ? (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>URL</Text>
            <TouchableOpacity style={styles.urlContainer} onPress={handleOpenUrl}>
              <Text style={styles.urlText}>{resource.url}</Text>
              <Text style={styles.openIcon}>🔗</Text>
            </TouchableOpacity>
          </View>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={handleTogglePin}>
          <Text style={styles.iconButtonText}>
            {resource.isPinned ? '📌' : '📍'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Text style={styles.iconButtonText}>↗️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleCopy}>
          <Text style={styles.iconButtonText}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
          <Text style={styles.iconButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.iconButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title and Type */}
        <View style={[styles.headerSection, { borderLeftColor: resource.color || '#9E9E9E' }]}>
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>{TYPE_ICONS[resource.type]}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{TYPE_LABELS[resource.type]}</Text>
            </View>
            {resource.isPinned && <Text style={styles.pinBadge}>📌 Fijado</Text>}
          </View>
          <Text style={styles.title}>{resource.title}</Text>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              Creado: {formatDate(resource.createdAt)}
            </Text>
            {resource.updatedAt !== resource.createdAt && (
              <Text style={styles.metadataText}>
                Actualizado: {formatDate(resource.updatedAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Description */}
        {resource.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{resource.description}</Text>
          </View>
        )}

        {/* Content */}
        {renderContent()}

        {/* Tags */}
        {resource.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {resource.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Metadata Stats */}
        {resource.metadata && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Estadísticas</Text>
            <View style={styles.statsContainer}>
              {resource.metadata.wordCount !== undefined && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Palabras</Text>
                  <Text style={styles.statValue}>{resource.metadata.wordCount}</Text>
                </View>
              )}
              {resource.metadata.lineCount !== undefined && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Líneas</Text>
                  <Text style={styles.statValue}>{resource.metadata.lineCount}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  iconButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFF',
  },
  pinBadge: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 32,
  },
  metadata: {
    marginTop: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  descriptionSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contentSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 12,
  },
  noteContent: {
    paddingVertical: 8,
  },
  snippetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  languageBadge: {
    backgroundColor: '#424242',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  languageBadgeText: {
    fontSize: 11,
    color: '#AAA',
    fontWeight: '500',
  },
  codeScroll: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 12,
    maxHeight: 500,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#F8F8F2',
    lineHeight: 18,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    color: '#2196F3',
    marginRight: 12,
  },
  openIcon: {
    fontSize: 20,
  },
  tagsSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

const markdownStyles: any = {
  body: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    color: '#000',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 8,
    color: '#000',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 6,
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
    marginVertical: 8,
  },
  fence: {
    backgroundColor: '#2D2D2D',
    color: '#F8F8F2',
    fontFamily: 'monospace',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  bullet_list: {
    marginLeft: 12,
    marginVertical: 8,
  },
  ordered_list: {
    marginLeft: 12,
    marginVertical: 8,
  },
  list_item: {
    marginBottom: 6,
    lineHeight: 20,
  },
  link: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  hr: {
    backgroundColor: '#E0E0E0',
    height: 1,
    marginVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: 8,
  },
  thead: {
    backgroundColor: '#F5F5F5',
  },
  tbody: {},
  th: {
    padding: 8,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  td: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
};
