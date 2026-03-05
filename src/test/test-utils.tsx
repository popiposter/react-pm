import { render as rtlRender, screen, waitFor, fireEvent, queries } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { RenderOptions, RenderResult } from '@testing-library/react';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
    removeItem(key: string) {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock matchMedia for Mantine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn ? vi.fn() : () => {},
    removeListener: vi.fn ? vi.fn() : () => {},
    addEventListener: vi.fn ? vi.fn() : () => {},
    removeEventListener: vi.fn ? vi.fn() : () => {},
    dispatchEvent: vi.fn ? vi.fn() : () => {},
  }),
});

/**
 * Custom render function that wraps the component with necessary providers
 * for testing in the context of the Timesheets application.
 */
export function render(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'queries'>
): RenderResult {
  return rtlRender(
    <MantineProvider>{ui}</MantineProvider>,
    options
  );
}

// Re-export testing library exports
export { screen, waitFor, fireEvent, queries };
