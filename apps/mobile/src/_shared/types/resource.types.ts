export enum ResourceType {
  NOTE = 'NOTE',
  SNIPPET = 'SNIPPET',
  BOOKMARK = 'BOOKMARK',
}

export interface Resource {
  id: string;
  userId: string;
  categoryId?: string;
  type: ResourceType;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
  metadata?: ResourceMetadata;
  tags: string[];
  isPinned: boolean;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceMetadata {
  // Para BOOKMARK
  favicon?: string;
  siteName?: string;
  imageUrl?: string;

  // Para SNIPPET
  lineCount?: number;

  // Para NOTE
  wordCount?: number;
}

export interface CreateResourceDto {
  type: ResourceType;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
  categoryId?: string;
  tags?: string[];
  color?: string;
}

export interface UpdateResourceDto {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
  categoryId?: string;
  tags?: string[];
  isPinned?: boolean;
  color?: string;
}

export interface ResourceFilters {
  type?: ResourceType;
  categoryId?: string;
  tags?: string[];
  isPinned?: boolean;
  search?: string;
}

export interface ResourceStats {
  total: number;
  byType: {
    NOTE: number;
    SNIPPET: number;
    BOOKMARK: number;
  };
  pinned: number;
  totalTags: number;
}

export type ResourceResponse = Resource;
export type ResourceListResponse = Resource[];
