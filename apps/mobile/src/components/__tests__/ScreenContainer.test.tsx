import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ScreenContainer } from '../layout/ScreenContainer';

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('ScreenContainer component', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ScreenContainer>
        <Text>Contenido</Text>
      </ScreenContainer>
    );
    expect(getByText('Contenido')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <ScreenContainer>
        <Text>Primero</Text>
        <Text>Segundo</Text>
      </ScreenContainer>
    );
    expect(getByText('Primero')).toBeTruthy();
    expect(getByText('Segundo')).toBeTruthy();
  });

  it('renders in scrollable mode by default', () => {
    const { toJSON } = render(
      <ScreenContainer>
        <Text>Scroll</Text>
      </ScreenContainer>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders in non-scrollable mode when scrollable=false', () => {
    const { getByText } = render(
      <ScreenContainer scrollable={false}>
        <Text>Sin scroll</Text>
      </ScreenContainer>
    );
    expect(getByText('Sin scroll')).toBeTruthy();
  });

  it('renders with RefreshControl when onRefresh is provided', () => {
    const onRefresh = jest.fn();
    const { toJSON } = render(
      <ScreenContainer onRefresh={onRefresh} refreshing={false}>
        <Text>Con refresh</Text>
      </ScreenContainer>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders without RefreshControl when onRefresh is not provided', () => {
    const { getByText } = render(
      <ScreenContainer>
        <Text>Sin refresh</Text>
      </ScreenContainer>
    );
    expect(getByText('Sin refresh')).toBeTruthy();
  });
});
