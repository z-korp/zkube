import { TextStyle } from 'pixi.js';
import { FONT_TITLE, FONT_BOLD, FONT_BODY, UI } from './colors';

export const TEXT_STYLES = {
  title: (size = 24) => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: size,
    fontWeight: 'bold',
    fill: UI.text.primary,
  }),

  label: (size = 11) => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: size,
    fill: UI.text.secondary,
  }),

  value: (size = 14) => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: size,
    fontWeight: 'bold',
    fill: UI.text.primary,
  }),

  valueDanger: (size = 14) => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: size,
    fontWeight: 'bold',
    fill: UI.status.danger,
  }),

  gold: (size = 12) => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: size,
    fontWeight: 'bold',
    fill: UI.accent.gold,
  }),

  cube: (size = 12) => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: size,
    fontWeight: 'bold',
    fill: UI.accent.gold,
  }),

  muted: (size = 14) => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: size,
    fill: UI.text.muted,
  }),

  subtitle: (size = 13) => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: size,
    fill: UI.text.secondary,
  }),

  combo: (size = 12, color = UI.accent.gold) => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: size,
    fontWeight: 'bold',
    fill: color,
  }),

  badge: (size = 14, color = UI.accent.blueLight) => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: size,
    fontWeight: 'bold',
    fill: color,
  }),
} as const;

export type TextStyleFactory = typeof TEXT_STYLES;
