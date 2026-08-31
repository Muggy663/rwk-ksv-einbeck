import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

// Mock RadixUI's Tabs component
jest.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, defaultValue }: any) => (
    <div data-testid="tabs-root" data-default-value={defaultValue}>
      {children}
    </div>
  ),
  List: (props: any) => <div data-testid="tabs-list" {...props} />,
  Trigger: ({ children, value, ...props }: any) => (
    <button data-testid="tabs-trigger" data-value={value} {...props}>
      {children}
    </button>
  ),
  Content: ({ children, value, ...props }: any) => (
    <div data-testid="tabs-content" data-value={value} {...props}>
      {children}
    </div>
  ),
}));

describe('Tabs', () => {
  it('renders tabs components correctly', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('applies defaultValue correctly', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByTestId('tabs-root')).toHaveAttribute('data-default-value', 'tab1');
  });

  it('renders TabsTrigger with correct value', () => {
    render(<TabsTrigger value="test-value">Test Tab</TabsTrigger>);
    
    expect(screen.getByTestId('tabs-trigger')).toHaveAttribute('data-value', 'test-value');
  });

  it('renders TabsContent with correct value', () => {
    render(<TabsContent value="test-content">Test Content</TabsContent>);
    
    expect(screen.getByTestId('tabs-content')).toHaveAttribute('data-value', 'test-content');
  });
});
