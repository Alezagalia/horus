import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from '../ui/Chip';

describe('Chip component', () => {
  it('renders label text', () => {
    const { getByText } = render(<Chip label="Hábitos" />);
    expect(getByText('Hábitos')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Chip label="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders in inactive state by default', () => {
    const { toJSON } = render(<Chip label="Inactivo" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders in active state', () => {
    const { toJSON } = render(<Chip label="Activo" active />);
    expect(toJSON()).toBeTruthy();
  });

  it('does not render badge when badge is 0', () => {
    const { queryByText } = render(<Chip label="Sin badge" badge={0} />);
    // Badge with value 0 should not be visible
    expect(queryByText('0')).toBeNull();
  });

  it('renders badge when badge > 0', () => {
    const { getByText } = render(<Chip label="Con badge" badge={5} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('renders badge in active state', () => {
    const { getByText } = render(<Chip label="Activo" active badge={3} />);
    expect(getByText('Activo')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });
});
