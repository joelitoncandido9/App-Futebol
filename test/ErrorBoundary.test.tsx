import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

function BomComponente() {
  return <div>Tudo ok</div>;
}

function ComponenteQueQuebra(): React.ReactNode {
  throw new Error('Erro de teste');
}

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <BomComponente />
      </ErrorBoundary>
    );
    expect(screen.getByText('Tudo ok')).toBeInTheDocument();
  });

  it('should render fallback on error', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ComponenteQueQuebra />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Erro de teste')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ComponenteQueQuebra />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });
});
