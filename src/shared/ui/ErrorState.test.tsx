// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorState message="Error" className="my-custom-class" />);
    const div = container.firstElementChild;
    expect(div?.classList.contains('my-custom-class')).toBe(true);
  });
});
