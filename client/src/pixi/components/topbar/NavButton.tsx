import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { FONT_BODY } from '../../utils/colors';
import { color } from '@/pixi/design/tokens';
import type { IconType } from '../../assets/catalog';
import { PixiButton } from '../../ui/PixiButton';

type NavIcon = 'quests' | 'trophy' | 'shop' | 'settings';

interface NavButtonProps {
  icon: NavIcon;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
  label?: string;
  badge?: number;
}

const NAV_ICON_MAP: Record<NavIcon, IconType> = {
  quests: 'scroll',
  trophy: 'trophy',
  shop: 'shop',
  settings: 'settings',
};

export const NavButton = ({
  icon,
  x,
  y,
  width,
  height,
  onClick,
  badge,
}: NavButtonProps) => {
  const catalogIcon = NAV_ICON_MAP[icon];

  const drawBadge = useCallback((g: PixiGraphics) => {
    if (!badge || badge <= 0) return;
    g.clear();
    g.circle(0, 0, 8);
    g.fill({ color: color.status.danger });
  }, [badge]);

  const badgeStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: 'bold',
    fill: 0xffffff,
  }), []);

  return (
    <pixiContainer x={x} y={y}>
      <PixiButton
        width={width}
        height={height}
        iconOnly
        icon={catalogIcon}
        onPress={onClick}
      />

      {badge !== undefined && badge > 0 && (
        <pixiContainer x={width - 6} y={6}>
          <pixiGraphics draw={drawBadge} eventMode="none" />
          <pixiText
            text={String(badge)}
            anchor={{ x: 0.5, y: 0.5 }}
            style={badgeStyle}
            eventMode="none"
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

export default NavButton;
