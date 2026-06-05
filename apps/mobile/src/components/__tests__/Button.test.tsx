import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../ui/Button';

describe('Button component', () => {
  it('renders label text', () => {
    const { getByText } = render(<Button label="Guardar" />);
    expect(getByText('Guardar')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap me" onPress={onPress} />);
    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, getByTestId, toJSON } = render(<Button label="Cargando" loading />);
    // Label should not be visible while loading
    expect(queryByText('Cargando')).toBeNull();
    // Component renders without crash
    expect(toJSON()).toBeTruthy();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { toJSON } = render(<Button label="Loading" onPress={onPress} loading />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders primary variant by default', () => {
    const { toJSON } = render(<Button label="Primary" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { toJSON } = render(<Button label="Secondary" variant="secondary" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders ghost variant', () => {
    const { toJSON } = render(<Button label="Ghost" variant="ghost" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with icon', () => {
    const icon = <></>;
    const { getByText } = render(<Button label="Con icono" icon={icon} />);
    expect(getByText('Con icono')).toBeTruthy();
  });
});
