import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils';
import { LoginForm } from '../LoginForm';
import { useAuth } from '@/hooks/use-auth';

// Mock useAuth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    // Setup default mock implementation
    (useAuth as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      error: null,
    });
  });

  it('renders the login form correctly', () => {
    render(<LoginForm />);
    
    // Check if important elements are rendered
    expect(screen.getByText('Anmelden')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passwort/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<LoginForm />);
    
    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }));
    
    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/E-Mail ist erforderlich/i)).toBeInTheDocument();
      expect(screen.getByText(/Passwort ist erforderlich/i)).toBeInTheDocument();
    });
  });

  it('calls signIn function with correct credentials', async () => {
    const mockSignIn = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      error: null,
    });
    
    render(<LoginForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/E-Mail/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/Passwort/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }));
    
    // Check if signIn was called with correct arguments
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state when submitting', () => {
    (useAuth as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: true,
      error: null,
    });
    
    render(<LoginForm />);
    
    // Check if button shows loading state
    expect(screen.getByRole('button', { name: /Anmelden\.\.\./i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anmelden\.\.\./i })).toBeDisabled();
  });

  it('shows error message when authentication fails', () => {
    (useAuth as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      error: new Error('auth/invalid-credential'),
    });
    
    render(<LoginForm />);
    
    // Check if error message is displayed
    expect(screen.getByText(/Anmeldefehler/i)).toBeInTheDocument();
    expect(screen.getByText(/Ungültige Anmeldedaten/i)).toBeInTheDocument();
  });
});