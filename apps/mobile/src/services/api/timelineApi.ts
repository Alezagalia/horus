import { axiosInstance } from '../axios';
import type {
  TimelineResponse,
  TimelineEvent,
  TimelineModule,
  TimelineEventCategory,
} from '@horus/shared';

export type { TimelineResponse, TimelineEvent, TimelineModule, TimelineEventCategory };

export interface TimelineParams {
  modules?: TimelineModule[];
  categories?: TimelineEventCategory[];
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const timelineApi = {
  get: async (params: TimelineParams = {}): Promise<TimelineResponse> => {
    const { data } = await axiosInstance.get('/timeline', {
      params: {
        ...params,
        modules: params.modules?.join(','),
        categories: params.categories?.join(','),
      },
    });
    return data;
  },
};
