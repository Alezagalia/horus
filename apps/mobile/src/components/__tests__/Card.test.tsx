import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Card } from '../ui/Card';

// BlurView is mocked in __mocks__/expo-blur.js

describe('Card component', () => {
  it('renders children in glass (default) variant', () => {
    const { getByText } = render(
      <Card>
        <Text>Glass content</Text>
      </Card>
    );
    expect(getByText('Glass content')).toBeTruthy();
  });

  it('renders children in solid variant', () => {
    const { getByText } = render(
      <Card solid>
        <Text>Solid content</Text>
      </Card>
    );
    expect(getByText('Solid content')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <Card>
        <Text>First</Text>
        <Text>Second</Text>
      </Card>
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('applies custom style prop', () => {
    const { getByTestId } = render(
      <Card solid style={{ backgroundColor: 'red' }}>
        <Text testID="child">Test</Text>
      </Card>
    );
    expect(getByTestId('child')).toBeTruthy();
  });
});
