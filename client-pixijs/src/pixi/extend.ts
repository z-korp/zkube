import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';

// Extend PixiJS components for use with @pixi/react
// This must be called before using any pixi components
extend({
  Container,
  Graphics,
  Sprite,
  Text,
  TilingSprite,
});
