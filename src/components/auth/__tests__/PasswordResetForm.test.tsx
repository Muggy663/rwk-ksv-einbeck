import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils';
import { PasswordResetForm } from '../PasswordResetForm';
import { useAuth } from '@/hooks/use-auth';

// Mock useAuth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

describe('PasswordResetForm', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    // Setup default mock implementation
    (useAuth as jest.Mock).mockReturnValue({
      resetPassword: jest.fn(),
      loading: false,
      error: null,
    });
  });

  it('renders the password reset form correctly', () => {
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    // Check if important elements are rendered
    expect(screen.getByText('Passwort zurücksetzen')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zurücksetzen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zurück/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    // Enter invalid email
    fireEvent.change(screen.getByLabelText(/E-Mail/i), {
      target: { value: 'invalid-email' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/i }));
    
    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText(/Ungültige E-Mail-Adresse/i)).toBeInTheDocument();
    });
  });

  it('calls resetPassword function with correct email', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
      error: null,
    });
    
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/E-Mail/i), {
      target: { value: 'test@example.com' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/i }));
    
    // Check if resetPassword was called with correct argument
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after successful password reset', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
      error: null,
    });
    
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/E-Mail/i), {
      target: { value: 'test@example.com' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/i }));
    
    // Check if success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/E-Mail wurde gesendet/i)).toBeInTheDocument();
    });
  });

  it('shows loading state when submitting', () => {
    (useAuth as jest.Mock).mockReturnValue({
      resetPassword: jest.fn(),
      loading: true,
      error: null,
    });
    
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    // Check if button shows loading state
    expect(screen.getByRole('button', { name: /Wird gesendet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wird gesendet/i })).toBeDisabled();
  });

  it('calls onBack when back button is clicked', () => {
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    // Click back button
    fireEvent.click(screen.getByRole('button', { name: /Zurück/i }));
    
    // Check if onBack was called
    expect(mockOnBack).toHaveBeenCalled();
  });
});