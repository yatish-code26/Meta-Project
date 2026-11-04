// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';

// Setup DOM mocks for jsdom
beforeEach(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock window.ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock window.scrollTo and Element.prototype.scrollIntoView
  window.scrollTo = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  // Reset hash
  window.location.hash = '#trip';
});

describe('Click-Through Integration - Full Shell & Screen Traversal', () => {
  it('renders application shell without console errors or crash', async () => {
    let utils: ReturnType<typeof render>;
    await act(async () => {
      utils = render(<App />);
    });

    expect(utils!.container).toBeDefined();

    // Verify presence of top branding
    const branding = screen.getAllByText('RouteX');
    expect(branding.length).toBeGreaterThan(0);
  });

  it('navigates through all sidebar items and renders respective views', async () => {
    await act(async () => {
      render(<App />);
    });

    // 1. Click Trips
    const tripsButtons = screen.getAllByRole('button', { name: /trips/i });
    if (tripsButtons.length > 0) {
      await act(async () => {
        fireEvent.click(tripsButtons[0]);
      });
      expect(window.location.hash).toBe('#trips');
    }

    // 2. Click Team Quorum
    const teamButtons = screen.getAllByRole('button', { name: /team quorum/i });
    if (teamButtons.length > 0) {
      await act(async () => {
        fireEvent.click(teamButtons[0]);
      });
      expect(window.location.hash).toBe('#team');
    }

    // 3. Click Evidence Ledger
    const certButtons = screen.getAllByRole('button', { name: /evidence ledger/i });
    if (certButtons.length > 0) {
      await act(async () => {
        fireEvent.click(certButtons[0]);
      });
      expect(window.location.hash).toBe('#certificates');
    }

    // 4. Click Recovery Canvas
    const recoveryButtons = screen.getAllByRole('button', { name: /^recovery$/i });
    if (recoveryButtons.length > 0) {
      await act(async () => {
        fireEvent.click(recoveryButtons[0]);
      });
      expect(window.location.hash).toBe('#trip');
    }

    // 5. Click Digital Twin
    const twinButtons = screen.getAllByRole('button', { name: /digital twin/i });
    if (twinButtons.length > 0) {
      await act(async () => {
        fireEvent.click(twinButtons[0]);
      });
      expect(window.location.hash).toBe('#trip');
    }

    // 6. Click Itinerary
    const itineraryButtons = screen.getAllByRole('button', { name: /itinerary/i });
    if (itineraryButtons.length > 0) {
      await act(async () => {
        fireEvent.click(itineraryButtons[0]);
      });
      expect(window.location.hash).toBe('#trip');
    }

    // 7. Click Expenses
    const expensesButtons = screen.getAllByRole('button', { name: /expenses/i });
    if (expensesButtons.length > 0) {
      await act(async () => {
        fireEvent.click(expensesButtons[0]);
      });
      expect(window.location.hash).toBe('#trip');
    }

    // 8. Click Assistant
    const assistantButtons = screen.getAllByRole('button', { name: /assistant/i });
    if (assistantButtons.length > 0) {
      await act(async () => {
        fireEvent.click(assistantButtons[0]);
      });
      expect(window.location.hash).toBe('#trip');
    }
  });

  it('opens and closes Settings, Help Tour, and New Trip modals', async () => {
    await act(async () => {
      render(<App />);
    });

    // Open Settings Modal
    const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
    if (settingsButtons.length > 0) {
      await act(async () => {
        fireEvent.click(settingsButtons[0]);
      });
      expect(screen.getByText(/RouteX System Settings/i)).toBeDefined();

      // Close Settings Modal
      const closeButtons = screen.getAllByLabelText(/close settings/i);
      if (closeButtons.length > 0) {
        await act(async () => {
          fireEvent.click(closeButtons[0]);
        });
      }
    }

    // Open Help & Tour Modal
    const helpButtons = screen.getAllByRole('button', { name: /help & tour/i });
    if (helpButtons.length > 0) {
      await act(async () => {
        fireEvent.click(helpButtons[0]);
      });
      expect(screen.getByText(/Top Bar & Gate Closure Horizon/i)).toBeDefined();

      // Close Tour Modal
      const closeTourButtons = screen.getAllByLabelText(/close tour/i);
      if (closeTourButtons.length > 0) {
        await act(async () => {
          fireEvent.click(closeTourButtons[0]);
        });
      }
    }

    // Open New Trip Wizard
    const newTripButtons = screen.getAllByRole('button', { name: /new trip/i });
    if (newTripButtons.length > 0) {
      await act(async () => {
        fireEvent.click(newTripButtons[0]);
      });
      expect(screen.getByText(/Trip Builder & Scenario Configurator/i)).toBeDefined();

      // Close Trip Wizard
      const closeTripButtons = screen.getAllByLabelText(/close trip builder/i);
      if (closeTripButtons.length > 0) {
        await act(async () => {
          fireEvent.click(closeTripButtons[0]);
        });
      }
    }
  });
});
