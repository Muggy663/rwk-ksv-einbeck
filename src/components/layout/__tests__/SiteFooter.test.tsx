import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteFooter } from '../SiteFooter';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('SiteFooter', () => {
  it('renders the copyright text with current year', () => {
    // Mock the current year
    const currentYear = new Date().getFullYear();
    
    render(<SiteFooter />);
    
    expect(screen.getByText(new RegExp(`© ${currentYear} KSV Einbeck`, 'i'))).toBeInTheDocument();
  });

  it('renders the version number', () => {
    render(<SiteFooter />);
    
    // Check for version text (using regex to be flexible with version number)
    expect(screen.getByText(/Version \d+\.\d+\.\d+/i)).toBeInTheDocument();
    
    // Check for Beta badge
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders the impressum link', () => {
    render(<SiteFooter />);
    
    const impressumLink = screen.getByText('Impressum');
    expect(impressumLink).toBeInTheDocument();
    expect(impressumLink.closest('a')).toHaveAttribute('href', '/impressum');
  });
});
