// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders default loading message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders custom message prop', () => {
    render(<LoadingState message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingState className="my-custom-class" />);
    const div = container.firstElementChild;
    expect(div?.classList.contains('my-custom-class')).toBe(true);
  });
});
