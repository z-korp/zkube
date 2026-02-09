import { useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import type { FullscreenLayout } from '../../hooks/useFullscreenLayout';
import { MenuButton } from './MenuButton';
import { CubeBalance } from './CubeBalance';
import { NavButton } from './NavButton';

interface TopBarProps {
  layout: FullscreenLayout;
  cubeBalance?: number;
  onMenuClick?: () => void;
  onQuestsClick?: () => void;
  onTrophyClick?: () => void;
  onShopClick?: () => void;
}

/**
 * Top navigation bar - Candy Crush style
 * 
 * Layout:
 * [Menu] [Cube Balance]              [Quests] [Trophy] [Shop]
 */
export const TopBar = ({
  layout,
  cubeBalance = 0,
  onMenuClick,
  onQuestsClick,
  onTrophyClick,
  onShopClick,
}: TopBarProps) => {
  const { screenWidth, topBarHeight, topBarY, uiScale, isMobile } = layout;
  
  // Button sizing
  const buttonSize = Math.round(isMobile ? 36 : 42);
  const buttonGap = Math.round(8 * uiScale);
  const sectionPadding = Math.round(12 * uiScale);
  
  // Left section: Menu + Cube balance
  const menuX = sectionPadding;
  const menuY = (topBarHeight - buttonSize) / 2;
  const cubeX = menuX + buttonSize + buttonGap;
  
  // Right section: Quests, Trophy, Shop
  const navButtonWidth = Math.round(isMobile ? 40 : 56);
  const shopX = screenWidth - sectionPadding - navButtonWidth;
  const trophyX = shopX - navButtonWidth - buttonGap;
  const questsX = trophyX - navButtonWidth - buttonGap;
  
  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Semi-transparent gradient background
    g.rect(0, 0, screenWidth, topBarHeight);
    g.fill({ color: 0x0f172a, alpha: 0.85 });
    
    g.rect(0, topBarHeight - 1, screenWidth, 1);
    g.fill({ color: 0x334155, alpha: 0.4 });
  }, [screenWidth, topBarHeight]);

  return (
    <pixiContainer y={topBarY}>
      {/* Background */}
      <pixiGraphics draw={drawBackground} />
      
      {/* Menu button (hamburger) */}
      <MenuButton
        x={menuX}
        y={menuY}
        size={buttonSize}
        onClick={onMenuClick}
      />
      
      {/* Cube balance */}
      <CubeBalance
        balance={cubeBalance}
        x={cubeX}
        y={menuY}
        height={buttonSize}
        uiScale={uiScale}
      />
      
      {/* Navigation buttons (right side) */}
      <NavButton
        icon="quests"
        x={questsX}
        y={menuY}
        width={navButtonWidth}
        height={buttonSize}
        onClick={onQuestsClick}
        label={isMobile ? undefined : 'Quests'}
      />
      
      <NavButton
        icon="trophy"
        x={trophyX}
        y={menuY}
        width={navButtonWidth}
        height={buttonSize}
        onClick={onTrophyClick}
      />
      
      <NavButton
        icon="shop"
        x={shopX}
        y={menuY}
        width={navButtonWidth}
        height={buttonSize}
        onClick={onShopClick}
      />
    </pixiContainer>
  );
};

export default TopBar;
