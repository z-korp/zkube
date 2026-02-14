/**
 * PageNavigator - Context for managing page-based navigation with slide transitions
 * 
 * Pages slide in from the right when navigating forward,
 * and slide out to the right when going back to home.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useTick } from '@pixi/react';

// ============================================================================
// TYPES
// ============================================================================

export type PageId = 'home' | 'leaderboard' | 'shop' | 'quests' | 'settings' | 'mygames' | 'loadout' | 'tutorial' | 'map';

interface PageNavigatorContextType {
  currentPage: PageId;
  previousPage: PageId | null;
  isTransitioning: boolean;
  transitionDirection: 'forward' | 'back' | null;
  transitionProgressRef: React.RefObject<number>;
  navigate: (page: PageId) => void;
  goHome: () => void;
  goBack: () => void;
}

const PageNavigatorContext = createContext<PageNavigatorContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

const TRANSITION_DURATION = 300; // ms

export const PageNavigatorProvider: React.FC<{ children: React.ReactNode; initialPage?: PageId }> = ({ children, initialPage }) => {
  const [currentPage, setCurrentPage] = useState<PageId>(initialPage ?? 'home');
  const [previousPage, setPreviousPage] = useState<PageId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back' | null>(null);
  const transitionProgressRef = useRef(0);
  
  const startTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);
  const [tickEnabled, setTickEnabled] = useState(false);

  const tickTransition = useCallback(() => {
    if (!isAnimatingRef.current) return;
    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / TRANSITION_DURATION, 1);

    const eased = 1 - Math.pow(1 - progress, 3);
    transitionProgressRef.current = eased;

    if (progress >= 1) {
      isAnimatingRef.current = false;
      transitionProgressRef.current = 0;
      setTickEnabled(false);
      setIsTransitioning(false);
      setTransitionDirection(null);
      setPreviousPage(null);
    }
  }, []);
  useTick(tickTransition, tickEnabled);

  const animateTransition = useCallback((targetPage: PageId, direction: 'forward' | 'back') => {
    if (isTransitioning) return;

    setPreviousPage(currentPage);
    setIsTransitioning(true);
    setTransitionDirection(direction);
    transitionProgressRef.current = 0;
    startTimeRef.current = performance.now();
    setCurrentPage(targetPage);

    isAnimatingRef.current = true;
    setTickEnabled(true);
  }, [currentPage, isTransitioning]);

  const navigate = useCallback((page: PageId) => {
    if (page === currentPage || isTransitioning) return;
    console.log('[PageNavigator]', currentPage, '→', page);
    animateTransition(page, 'forward');
  }, [currentPage, isTransitioning, animateTransition]);

  const goHome = useCallback(() => {
    if (currentPage === 'home' || isTransitioning) return;
    console.log('[PageNavigator]', currentPage, '→ home (back)');
    animateTransition('home', 'back');
  }, [currentPage, isTransitioning, animateTransition]);

  const goBack = useCallback(() => {
    goHome(); // For now, back always goes home
  }, [goHome]);

  const value: PageNavigatorContextType = {
    currentPage,
    previousPage,
    isTransitioning,
    transitionDirection,
    transitionProgressRef,
    navigate,
    goHome,
    goBack,
  };

  return (
    <PageNavigatorContext.Provider value={value}>
      {children}
    </PageNavigatorContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const usePageNavigator = () => {
  const context = useContext(PageNavigatorContext);
  if (!context) {
    throw new Error('usePageNavigator must be used within a PageNavigatorProvider');
  }
  return context;
};

export default PageNavigatorProvider;
