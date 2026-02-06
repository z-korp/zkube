/**
 * PageNavigator - Context for managing page-based navigation with slide transitions
 * 
 * Pages slide in from the right when navigating forward,
 * and slide out to the right when going back to home.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type PageId = 'home' | 'leaderboard' | 'shop' | 'quests' | 'settings' | 'mygames' | 'loadout' | 'tutorial';

interface PageNavigatorContextType {
  currentPage: PageId;
  previousPage: PageId | null;
  isTransitioning: boolean;
  transitionDirection: 'forward' | 'back' | null;
  transitionProgress: number; // 0 to 1
  navigate: (page: PageId) => void;
  goHome: () => void;
  goBack: () => void;
}

const PageNavigatorContext = createContext<PageNavigatorContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

const TRANSITION_DURATION = 300; // ms

export const PageNavigatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [previousPage, setPreviousPage] = useState<PageId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back' | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  
  const transitionRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionRef.current) {
        cancelAnimationFrame(transitionRef.current);
      }
    };
  }, []);

  const animateTransition = useCallback((targetPage: PageId, direction: 'forward' | 'back') => {
    if (isTransitioning) return;

    setPreviousPage(currentPage);
    setIsTransitioning(true);
    setTransitionDirection(direction);
    setTransitionProgress(0);
    startTimeRef.current = performance.now();

    // Set current page immediately so we render the target page during transition
    setCurrentPage(targetPage);

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setTransitionProgress(eased);

      if (progress < 1) {
        transitionRef.current = requestAnimationFrame(animate);
      } else {
        // Transition complete
        setIsTransitioning(false);
        setTransitionDirection(null);
        setTransitionProgress(0);
        setPreviousPage(null);
        transitionRef.current = null;
      }
    };

    transitionRef.current = requestAnimationFrame(animate);
  }, [currentPage, isTransitioning]);

  const navigate = useCallback((page: PageId) => {
    if (page === currentPage || isTransitioning) return;
    animateTransition(page, 'forward');
  }, [currentPage, isTransitioning, animateTransition]);

  const goHome = useCallback(() => {
    if (currentPage === 'home' || isTransitioning) return;
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
    transitionProgress,
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
