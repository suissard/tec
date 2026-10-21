import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppStore } from '@/stores/app';

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useRealTimers();
  });

  it('toggleMobileMenu inverse isMobileMenuOpen', () => {
    const store = useAppStore();
    expect(store.isMobileMenuOpen).toBe(false);
    store.toggleMobileMenu();
    expect(store.isMobileMenuOpen).toBe(true);
    store.toggleMobileMenu();
    expect(store.isMobileMenuOpen).toBe(false);
  });

  it('openMobileMenu / closeMobileMenu forcent l’état', () => {
    const store = useAppStore();
    store.openMobileMenu();
    expect(store.isMobileMenuOpen).toBe(true);
    store.closeMobileMenu();
    expect(store.isMobileMenuOpen).toBe(false);
  });

  it('setLoading met à jour isLoading', () => {
    const store = useAppStore();
    store.setLoading(true);
    expect(store.isLoading).toBe(true);
    store.setLoading(false);
    expect(store.isLoading).toBe(false);
  });

  it('showToast ajoute un toast avec timer auto-hide', () => {
    vi.useFakeTimers();
    const store = useAppStore();
    store.showToast('Test', 'success');
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0].message).toBe('Test');
    expect(store.toasts[0].type).toBe('success');
    vi.advanceTimersByTime(4000);
    expect(store.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('la pile de toasts est bornée à 3 entrées (les plus anciens tombent)', () => {
    vi.useFakeTimers();
    const store = useAppStore();
    store.showToast('T1');
    store.showToast('T2');
    store.showToast('T3');
    store.showToast('T4');
    expect(store.toasts).toHaveLength(3);
    expect(store.toasts.map((toast) => toast.message)).toEqual(['T2', 'T3', 'T4']);
    store.hideToast();
    vi.useRealTimers();
  });

  it('hideToast(id) retire le toast spécifique, sans id les masque tous', () => {
    const store = useAppStore();
    store.showToast('Toast 1', 'info');
    const id = store.toasts[0].id;
    store.showToast('Toast 2', 'error');
    store.hideToast(id);
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0].message).toBe('Toast 2');
    store.hideToast();
    expect(store.toasts).toHaveLength(0);
  });
});
