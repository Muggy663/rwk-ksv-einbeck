import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '../label';

describe('Label', () => {
  it('renders correctly with default props', () => {
    render(<Label htmlFor="test-input">Test Label</Label>);
    
    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('applies custom className', () => {
    render(
      <Label htmlFor="test-input" className="custom-class">
        Custom Label
      </Label>
    );
    
    const label = screen.getByText('Custom Label');
    expect(label).toHaveClass('custom-class');
  });

  it('renders with children', () => {
    render(
      <Label htmlFor="test-input">
        <span data-testid="child-element">Child Element</span>
      </Label>
    );
    
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Child Element')).toBeInTheDocument();
  });
});
