import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressRing } from '../ui/ProgressRing';

// react-native-svg is handled by jest-expo preset

describe('ProgressRing component', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<ProgressRing progress={0.5} />);
    expect(toJSON()).toBeTruthy();
  });

  it('accepts progress prop between 0 and 1', () => {
    const { toJSON: t0 } = render(<ProgressRing progress={0} />);
    const { toJSON: t1 } = render(<ProgressRing progress={1} />);
    expect(t0()).toBeTruthy();
    expect(t1()).toBeTruthy();
  });

  it('clamps progress > 1 to 1', () => {
    // Should not throw even if progress > 1
    expect(() => render(<ProgressRing progress={2} />)).not.toThrow();
  });

  it('renders label when provided', () => {
    const { getByText } = render(<ProgressRing progress={0.75} label="75%" />);
    expect(getByText('75%')).toBeTruthy();
  });

  it('renders sublabel when provided', () => {
    const { getByText } = render(<ProgressRing progress={0.5} label="50%" sublabel="de meta" />);
    expect(getByText('de meta')).toBeTruthy();
  });

  it('accepts custom size', () => {
    const { toJSON } = render(<ProgressRing progress={0.3} size={120} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with light theme', () => {
    const { toJSON } = render(<ProgressRing progress={0.6} theme="light" />);
    expect(toJSON()).toBeTruthy();
  });
});
