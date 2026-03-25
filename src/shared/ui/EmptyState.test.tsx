// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders message', () => {
    render(<EmptyState message="No items found" />);
    expect(screen.getByText('No items found')).toBeDefined();
  });

  it('renders optional icon when provided', () => {
    render(<EmptyState message="No items" icon="📭" />);
    expect(screen.getByText('📭')).toBeDefined();
  });

  it('renders optional detail text when provided', () => {
    render(<EmptyState message="No items" detail="Try adjusting your filters" />);
    expect(screen.getByText('Try adjusting your filters')).toBeDefined();
  });

  it('works without optional props', () => {
    const { container } = render(<EmptyState message="Empty" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    expect(screen.getByText('Empty')).toBeDefined();
  });
});
