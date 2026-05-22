/**
 * Timeline API Service
 * F-16 - Arqueología Personal
 * Sprint 16 - US-153
 */

import { axiosInstance } from '@/lib/axios';
import type { TimelineEventCategory, TimelineModule, TimelineResponse } from '@horus/shared';

export interface TimelineRequestParams {
  from?: string;
  to?: string;
  modules?: TimelineModule[];
  categories?: TimelineEventCategory[];
  limit?: number;
  offset?: number;
}

export async function getTimeline(params: TimelineRequestParams = {}): Promise<TimelineResponse> {
  const response = await axiosInstance.get<TimelineResponse>('/timeline', {
    params: {
      ...params,
      modules: params.modules?.join(','),
      categories: params.categories?.join(','),
    },
  });
  return response.data;
}
