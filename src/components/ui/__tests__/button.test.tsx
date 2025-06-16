import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button', { name: /Test Button/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button', { name: /Disabled Button/i });
    expect(button).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Destructive Button</Button>);
    
    const button = screen.getByRole('button', { name: /Destructive Button/i });
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies size classes correctly', () => {
    render(<Button size="sm">Small Button</Button>);
    
    const button = screen.getByRole('button', { name: /Small Button/i });
    expect(button).toHaveClass('h-9');
  });

  it('renders as a different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="#">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: /Link Button/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
  });
});