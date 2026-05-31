import { describe, it, expect } from 'vitest';
import { cn, formatarHora, formatarData, formatarDataCompleta, formatarDataCurta } from '@/lib/utils';

describe('cn', () => {
  it('should merge classes correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should resolve tailwind conflicts', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });
});

describe('formatarHora', () => {
  it('should format ISO date to BRT time', () => {
    const result = formatarHora('2026-05-31T20:00:00+00:00');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return empty string for invalid date', () => {
    expect(formatarHora('')).toBe('');
    expect(formatarHora('invalid')).toBe('');
  });
});

describe('formatarData', () => {
  it('should format YYYY-MM-DD to Brazilian format', () => {
    const result = formatarData('2026-05-31');
    expect(result).toContain('31');
    expect(result).toContain('maio');
  });

  it('should return input for invalid date', () => {
    expect(formatarData('')).toBe('');
    expect(formatarData('not-a-date')).toBe('not-a-date');
  });
});

describe('formatarDataCompleta', () => {
  it('should include year and time', () => {
    const result = formatarDataCompleta('2026-05-31T20:00:00+00:00');
    expect(result).toContain('2026');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatarDataCurta', () => {
  it('should format short date', () => {
    const result = formatarDataCurta('2026-05-31T20:00:00+00:00');
    expect(result).toMatch(/\d{2}\/\d{2}/);
  });
});
