import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import { useAuth } from '@/hooks/use-auth';

// Mock the hooks
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock the PasswordResetForm component
jest.mock('../PasswordResetForm', () => ({
  PasswordResetForm: () => <div data-testid="password-reset-form">Password Reset Form</div>
}));

describe('LoginForm', () => {
  beforeEach(() => {
    // Setup default mocks
    (useAuth as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      error: null
    });
  });

  it('renders the login form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passwort/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<LoginForm />);
    
    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }));
    
    // Wait for validation errors - check for the actual error message that appears
    await waitFor(() => {
      expect(screen.getByText(/Ungültige E-Mail-Adresse/i)).toBeInTheDocument();
      expect(screen.getByText(/Passwort muss mindestens 6 Zeichen lang sein/i)).toBeInTheDocument();
    });
  });

  it('calls signIn function with correct credentials', async () => {
    const mockSignIn = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      error: null
    });
    
    render(<LoginForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/E-Mail/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/Passwort/i), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }));
    
    // Check if login was called with correct credentials
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state when submitting', () => {
    (useAuth as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: true,
      error: null
    });
    
    render(<LoginForm />);
    
    // Check if the button is in loading state
    expect(screen.getByRole('button', { name: /Anmelden.../i })).toBeDisabled();
  });
});