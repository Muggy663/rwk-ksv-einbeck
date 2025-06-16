import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PasswordResetForm } from '../PasswordResetForm';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';

// Mock the hooks and Firebase functions
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/firebase/config', () => ({
  auth: {}
}));

describe('PasswordResetForm', () => {
  const mockOnBack = jest.fn();
  
  beforeEach(() => {
    // Setup default mocks
    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });
    
    jest.clearAllMocks();
  });

  it('renders the password reset form correctly', () => {
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    expect(screen.getByLabelText(/E-Mail-Adresse/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Passwort zurücksetzen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zurück zur Anmeldung/i })).toBeInTheDocument();
  });

  it('calls sendPasswordResetEmail function with correct email', async () => {
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    // Fill in the form with valid email
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/i), {
        target: { value: 'test@example.com' }
      });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Passwort zurücksetzen/i }));
    });
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  it('calls onBack function when back button is clicked', async () => {
    render(<PasswordResetForm onBack={mockOnBack} />);
    
    // Click back button
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Zurück zur Anmeldung/i }));
    });
    
    // Check if onBack was called
    expect(mockOnBack).toHaveBeenCalled();
  });
});