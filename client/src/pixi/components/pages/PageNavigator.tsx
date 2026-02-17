import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useTick } from '@pixi/react';
import { duration } from '@/pixi/design/tokens';

export type PageId =
  | 'home' | 'loadout' | 'map' | 'play'
  | 'shop' | 'quests' | 'leaderboard'
  | 'mygames' | 'profile' | 'settings'
  | 'tutorial' | 'daily';

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

export const PageNavigatorProvider: React.FC<{
  children: React.ReactNode;
  initialPage?: PageId;
}> = ({ children, initialPage }) => {
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
    const progress = Math.min(elapsed / duration.pageSlide, 1);
    // easeOutCubic
    transitionProgressRef.current = 1 - Math.pow(1 - progress, 3);

    if (progress >= 1) {
      isAnimatingRef.current = false;
      setTickEnabled(false);
      setIsTransitioning(false);
      setTransitionDirection(null);
      setPreviousPage(null);
    }
  }, []);

  useTick(() => {
    if (!tickEnabled) return;
    tickTransition();
  });

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
    animateTransition(page, 'forward');
  }, [currentPage, isTransitioning, animateTransition]);

  const goHome = useCallback(() => {
    if (currentPage === 'home' || isTransitioning) return;
    animateTransition('home', 'back');
  }, [currentPage, isTransitioning, animateTransition]);

  const goBack = useCallback(() => {
    goHome();
  }, [goHome]);

  return (
    <PageNavigatorContext.Provider value={{
      currentPage,
      previousPage,
      isTransitioning,
      transitionDirection,
      transitionProgressRef,
      navigate,
      goHome,
      goBack,
    }}>
      {children}
    </PageNavigatorContext.Provider>
  );
};

export const usePageNavigator = () => {
  const context = useContext(PageNavigatorContext);
  if (!context) {
    throw new Error('usePageNavigator must be used within a PageNavigatorProvider');
  }
  return context;
};
