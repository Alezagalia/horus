/**
 * useEvents Hook
 * Sprint 4 - Calendar Integration
 *
 * React Query hooks for calendar events data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  getEvents,
  getEventById,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  type Event,
  type GetEventsParams,
  type CreateEventDTO,
  type UpdateEventDTO,
  type EventStatus,
} from '../api/events.api';

/**
 * Query key factory for events
 */
export const eventsKeys = {
  all: ['events'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: (params: GetEventsParams) => [...eventsKeys.lists(), params] as const,
  details: () => [...eventsKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventsKeys.details(), id] as const,
  upcoming: (limit: number) => [...eventsKeys.all, 'upcoming', limit] as const,
};

/**
 * Hook to fetch events in a date range
 */
export const useEvents = (
  params: GetEventsParams,
  options?: Omit<UseQueryOptions<Event[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Event[], Error>({
    queryKey: eventsKeys.list(params),
    queryFn: () => getEvents(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch upcoming events
 */
export const useUpcomingEvents = (
  limit: number = 10,
  options?: Omit<UseQueryOptions<Event[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Event[], Error>({
    queryKey: eventsKeys.upcoming(limit),
    queryFn: () => getUpcomingEvents(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch a single event by ID
 */
export const useEvent = (
  id: string,
  options?: Omit<UseQueryOptions<Event, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Event, Error>({
    queryKey: eventsKeys.detail(id),
    queryFn: () => getEventById(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to create a new event
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, CreateEventDTO>({
    mutationFn: createEvent,
    onSuccess: () => {
      // Invalidate all event queries to refetch
      queryClient.invalidateQueries({ queryKey: eventsKeys.all });
    },
  });
};

/**
 * Hook to update an existing event
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, { id: string; data: UpdateEventDTO }>({
    mutationFn: ({ id, data }) => updateEvent(id, data),
    onSuccess: (updatedEvent) => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: eventsKeys.all });
      // Update the specific event in cache
      queryClient.setQueryData(eventsKeys.detail(updatedEvent.id), updatedEvent);
    },
  });
};

/**
 * Hook to delete an event
 */
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteEvent,
    onSuccess: () => {
      // Invalidate all event queries to refetch
      queryClient.invalidateQueries({ queryKey: eventsKeys.all });
    },
  });
};

/**
 * Hook to update event status
 */
export const useUpdateEventStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, { id: string; status: EventStatus }>({
    mutationFn: ({ id, status }) => updateEventStatus(id, status),
    onSuccess: (updatedEvent) => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: eventsKeys.all });
      // Update the specific event in cache
      queryClient.setQueryData(eventsKeys.detail(updatedEvent.id), updatedEvent);
    },
  });
};
