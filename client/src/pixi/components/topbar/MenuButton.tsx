import { PixiButton } from '../../ui/PixiButton';

interface MenuButtonProps {
  x: number;
  y: number;
  size: number;
  onClick?: () => void;
}

export const MenuButton = ({ x, y, size, onClick }: MenuButtonProps) => (
  <PixiButton x={x} y={y} width={size} height={size} iconOnly icon="menu" onPress={onClick} />
);

export default MenuButton;
