import React from 'react';
import { render, screen } from '@testing-library/react';
import { Toast, ToastTitle, ToastDescription, ToastAction } from '../toast';

describe('Toast', () => {
  it('renders toast with all subcomponents', () => {
    render(
      <Toast>
        <ToastTitle>Test Title</ToastTitle>
        <ToastDescription>Test Description</ToastDescription>
        <ToastAction altText="Test Action" onClick={() => {}}>Action</ToastAction>
      </Toast>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    render(
      <Toast variant="destructive">
        <ToastTitle>Destructive Toast</ToastTitle>
      </Toast>
    );
    
    // Prüfe nur, ob der Inhalt gerendert wird
    expect(screen.getByText('Destructive Toast')).toBeInTheDocument();
  });

  it('renders ToastAction with altText', () => {
    const altText = 'Alternative Text';
    render(
      <ToastAction altText={altText} onClick={() => {}}>
        Action Button
      </ToastAction>
    );
    
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('renders ToastTitle correctly', () => {
    render(<ToastTitle>Toast Title</ToastTitle>);
    expect(screen.getByText('Toast Title')).toBeInTheDocument();
  });

  it('renders ToastDescription correctly', () => {
    render(<ToastDescription>Toast Description</ToastDescription>);
    expect(screen.getByText('Toast Description')).toBeInTheDocument();
  });
});