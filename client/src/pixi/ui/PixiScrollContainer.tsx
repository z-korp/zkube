/**
 * PixiScrollContainer - Scrollable container with mask clipping
 * 
 * Provides scrolling via:
 * - Mouse wheel
 * - Touch drag
 * - Programmatic scroll position
 * 
 * Uses a Graphics mask to clip content outside the visible area.
 */

import { 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef, 
  useState, 
  type ReactNode 
} from 'react';
import { 
  FederatedPointerEvent, 
  FederatedWheelEvent,
  Graphics as PixiGraphics,
  Container as PixiContainer,
  Rectangle,
} from 'pixi.js';

export interface PixiScrollContainerProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Visible width */
  width: number;
  /** Visible height */
  height: number;
  /** Total content height (for scroll bounds) */
  contentHeight: number;
  /** Scroll speed multiplier */
  scrollSpeed?: number;
  /** Whether to show scrollbar */
  showScrollbar?: boolean;
  /** Scrollbar width */
  scrollbarWidth?: number;
  /** Scrollbar color */
  scrollbarColor?: number;
  /** Scrollbar track color */
  scrollbarTrackColor?: number;
  /** Initial scroll position */
  initialScrollY?: number;
  /** Callback when scroll position changes */
  onScroll?: (scrollY: number) => void;
  /** Child content */
  children?: ReactNode;
  /** Whether horizontal scrolling is enabled */
  horizontal?: boolean;
  /** Content width (for horizontal scroll bounds) */
  contentWidth?: number;
}

export function PixiScrollContainer({
  x = 0,
  y = 0,
  width,
  height,
  contentHeight,
  scrollSpeed = 1,
  showScrollbar = true,
  scrollbarWidth = 6,
  scrollbarColor = 0xFFFFFF,
  scrollbarTrackColor = 0x000000,
  initialScrollY = 0,
  onScroll,
  children,
  horizontal = false,
  contentWidth = 0,
}: PixiScrollContainerProps) {
  const [scrollY, setScrollY] = useState(initialScrollY);
  const [scrollX, setScrollX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });
  const maskRef = useRef<PixiGraphics | null>(null);
  const contentRef = useRef<PixiContainer | null>(null);
  const prevMaskDims = useRef({ w: 0, h: 0 });

  // Calculate scroll bounds
  const maxScrollY = useMemo(() => 
    Math.max(0, contentHeight - height), 
    [contentHeight, height]
  );
  
  const maxScrollX = useMemo(() => 
    Math.max(0, (contentWidth || width) - width), 
    [contentWidth, width]
  );

  // Clamp scroll position
  const clampedScrollY = useMemo(() => 
    Math.max(0, Math.min(scrollY, maxScrollY)), 
    [scrollY, maxScrollY]
  );
  
  const clampedScrollX = useMemo(() => 
    Math.max(0, Math.min(scrollX, maxScrollX)), 
    [scrollX, maxScrollX]
  );

  // Scrollbar calculations
  const scrollbarHeight = useMemo(() => {
    if (contentHeight <= height) return height;
    return Math.max(30, (height / contentHeight) * height);
  }, [contentHeight, height]);

  const scrollbarY = useMemo(() => {
    if (maxScrollY === 0) return 0;
    const scrollRatio = clampedScrollY / maxScrollY;
    return scrollRatio * (height - scrollbarHeight);
  }, [clampedScrollY, maxScrollY, height, scrollbarHeight]);

  const drawMask = useCallback((g: PixiGraphics) => {
    if (prevMaskDims.current.w === width && prevMaskDims.current.h === height) return;
    prevMaskDims.current = { w: width, h: height };
    g.clear();
    g.rect(0, 0, width, height);
    g.fill({ color: 0xFFFFFF });
  }, [width, height]);

  // Draw scrollbar track
  const drawScrollbarTrack = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: scrollbarTrackColor, alpha: 0.3 });
    g.roundRect(0, 0, scrollbarWidth, height, scrollbarWidth / 2);
    g.fill();
  }, [scrollbarTrackColor, scrollbarWidth, height]);

  // Draw scrollbar thumb
  const drawScrollbarThumb = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: scrollbarColor, alpha: 0.6 });
    g.roundRect(0, 0, scrollbarWidth, scrollbarHeight, scrollbarWidth / 2);
    g.fill();
  }, [scrollbarColor, scrollbarWidth, scrollbarHeight]);

  // Handle wheel scroll
  const handleWheel = useCallback((e: FederatedWheelEvent) => {
    e.stopPropagation();
    
    const delta = e.deltaY * scrollSpeed * 0.5;
    
    setScrollY(prev => {
      const newScroll = Math.max(0, Math.min(prev + delta, maxScrollY));
      onScroll?.(newScroll);
      return newScroll;
    });
  }, [scrollSpeed, maxScrollY, onScroll]);

  // Handle drag start
  const handlePointerDown = useCallback((e: FederatedPointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.global.x,
      y: e.global.y,
      scrollX: clampedScrollX,
      scrollY: clampedScrollY,
    };
  }, [clampedScrollX, clampedScrollY]);

  // Handle drag move
  const handlePointerMove = useCallback((e: FederatedPointerEvent) => {
    if (!isDragging) return;
    
    const deltaY = dragStartRef.current.y - e.global.y;
    const newScrollY = Math.max(0, Math.min(
      dragStartRef.current.scrollY + deltaY,
      maxScrollY
    ));
    
    setScrollY(newScrollY);
    onScroll?.(newScrollY);

    if (horizontal) {
      const deltaX = dragStartRef.current.x - e.global.x;
      const newScrollX = Math.max(0, Math.min(
        dragStartRef.current.scrollX + deltaX,
        maxScrollX
      ));
      setScrollX(newScrollX);
    }
  }, [isDragging, maxScrollY, maxScrollX, horizontal, onScroll]);

  // Handle drag end
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const hitArea = useMemo(() => new Rectangle(0, 0, width, height), [width, height]);

  // Apply mask to content
  useEffect(() => {
    if (contentRef.current && maskRef.current) {
      contentRef.current.mask = maskRef.current;
    }
  }, []);

  // Whether scrollbar should be visible
  const showScrollbarActual = showScrollbar && contentHeight > height;

  // Adjust width for scrollbar
  const contentAreaWidth = showScrollbarActual 
    ? width - scrollbarWidth - 4 
    : width;

  return (
    <pixiContainer x={x} y={y}>
      {/* Mask (invisible, used for clipping) */}
      <pixiGraphics
        ref={(ref) => { maskRef.current = ref; }}
        draw={drawMask}
        alpha={0}
      />

      <pixiContainer
        ref={(ref) => { contentRef.current = ref; }}
        eventMode="static"
        hitArea={hitArea}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
        cursor={isDragging ? 'grabbing' : 'grab'}
      >
        {/* Content offset by scroll position */}
        <pixiContainer 
          y={-clampedScrollY}
          x={horizontal ? -clampedScrollX : 0}
        >
          {children}
        </pixiContainer>
      </pixiContainer>

      {/* Scrollbar */}
      {showScrollbarActual && (
        <pixiContainer x={contentAreaWidth + 2}>
          {/* Track */}
          <pixiGraphics draw={drawScrollbarTrack} />
          
          {/* Thumb */}
          <pixiGraphics 
            draw={drawScrollbarThumb}
            y={scrollbarY}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
}

/**
 * PixiScrollList - Convenience wrapper for vertical list items
 */
export interface PixiScrollListProps<T> {
  x?: number;
  y?: number;
  width: number;
  height: number;
  items: T[];
  itemHeight: number;
  itemGap?: number;
  renderItem: (item: T, index: number, y: number) => ReactNode;
  showScrollbar?: boolean;
  onScroll?: (scrollY: number) => void;
}

export function PixiScrollList<T>({
  x = 0,
  y = 0,
  width,
  height,
  items,
  itemHeight,
  itemGap = 8,
  renderItem,
  showScrollbar = true,
  onScroll,
}: PixiScrollListProps<T>) {
  const contentHeight = items.length * (itemHeight + itemGap) - itemGap;

  return (
    <PixiScrollContainer
      x={x}
      y={y}
      width={width}
      height={height}
      contentHeight={contentHeight}
      showScrollbar={showScrollbar}
      onScroll={onScroll}
    >
      {items.map((item, index) => (
        <pixiContainer key={index}>
          {renderItem(item, index, index * (itemHeight + itemGap))}
        </pixiContainer>
      ))}
    </PixiScrollContainer>
  );
}

export default PixiScrollContainer;
