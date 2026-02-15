/**
 * UIKit Demo Component
 * 
 * Showcases all UIKit components for testing and reference.
 * Can be rendered as a scene or modal for development.
 */

import { useState, useCallback } from 'react';
import { PixiButton } from './PixiButton';
import { PixiPanel } from './PixiPanel';
import { PixiModal, PixiConfirmModal } from './PixiModal';
import { PixiScrollContainer } from './PixiScrollContainer';
import {
  PixiProgressBar,
  PixiStarRating,
  PixiBadge,
  PixiIcon,
  PixiLabel,
  PixiDivider,
} from './PixiComponents';

export interface UIKitDemoProps {
  screenWidth: number;
  screenHeight: number;
  onClose?: () => void;
}

export function UIKitDemo({ screenWidth, screenHeight, onClose }: UIKitDemoProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress] = useState(0.65);
  const [rating, setRating] = useState(2);
  const [notifCount] = useState(5);

  const handleButtonPress = useCallback((name: string) => {
    console.log(`Button pressed: ${name}`);
  }, []);

  const demoWidth = Math.min(500, screenWidth - 40);
  const demoHeight = screenHeight - 80;
  const contentWidth = demoWidth - 40;

  return (
    <PixiModal
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      width={demoWidth}
      height={demoHeight}
      title="UIKit Demo"
      isOpen={true}
      onClose={onClose}
      variant="wood"
    >
      <PixiScrollContainer
        width={contentWidth}
        height={demoHeight - 100}
        contentHeight={900}
        showScrollbar={true}
      >
        {/* Section: Buttons */}
        <PixiLabel text="Buttons" variant="subtitle" y={0} />
        <PixiDivider y={28} width={contentWidth} />
        
        <pixiContainer y={40}>
          <PixiButton
            x={0}
            label="Primary"
            variant="orange"
            width={100}
            onPress={() => handleButtonPress('Primary')}
          />
          <PixiButton
            x={110}
            label="Success"
            variant="green"
            width={100}
            onPress={() => handleButtonPress('Success')}
          />
          <PixiButton
            x={220}
            label="Secondary"
            variant="purple"
            width={100}
            onPress={() => handleButtonPress('Secondary')}
          />
          <PixiButton
            x={330}
            label="Danger"
            variant="red"
            width={100}
            onPress={() => handleButtonPress('Danger')}
          />
        </pixiContainer>

        <pixiContainer y={100}>
          <PixiButton
            x={0}
            label="Disabled"
            variant="orange"
            width={100}
            disabled
          />
          <PixiButton
            x={110}
            icon="settings"
            iconOnly
            onPress={() => handleButtonPress('Icon')}
          />
          <PixiButton
            x={170}
            icon="music"
            iconOnly
            onPress={() => handleButtonPress('Music')}
          />
          <PixiButton
            x={230}
            label="With Icon"
            icon="starFilled"
            variant="green"
            width={140}
            onPress={() => handleButtonPress('With Icon')}
          />
        </pixiContainer>

        {/* Section: Panels */}
        <PixiLabel text="Panels" variant="subtitle" y={170} />
        <PixiDivider y={198} width={contentWidth} />

        <pixiContainer y={210}>
          <PixiPanel width={100} height={80} variant="wood" padding={8}>
            <PixiLabel text="Wood" variant="caption" />
          </PixiPanel>
          <PixiPanel x={110} width={100} height={80} variant="dark" padding={8}>
            <PixiLabel text="Dark" variant="caption" />
          </PixiPanel>
          <PixiPanel x={220} width={100} height={80} variant="leaf" padding={8}>
            <PixiLabel text="Leaf" variant="caption" />
          </PixiPanel>
          <PixiPanel x={330} width={100} height={80} variant="glass" padding={8}>
            <PixiLabel text="Glass" variant="caption" />
          </PixiPanel>
        </pixiContainer>

        {/* Section: Progress & Rating */}
        <PixiLabel text="Progress & Rating" variant="subtitle" y={310} />
        <PixiDivider y={338} width={contentWidth} />

        <pixiContainer y={350}>
          <PixiProgressBar
            width={200}
            height={24}
            progress={progress}
            showLabel
            fillColor={0x4ADE80}
          />
          <PixiProgressBar
            y={35}
            width={200}
            height={16}
            progress={0.3}
            fillColor={0xFF6B6B}
            label="30/100"
            showLabel
          />
          
          <pixiContainer x={220}>
            <PixiLabel text="Rating:" variant="body" />
            <PixiStarRating
              x={70}
              y={8}
              rating={rating}
              size={28}
            />
          </pixiContainer>
          
          <pixiContainer x={220} y={40}>
            <PixiButton
              label="-"
              variant="purple"
              width={40}
              onPress={() => setRating(r => Math.max(0, r - 1))}
            />
            <PixiButton
              x={50}
              label="+"
              variant="green"
              width={40}
              onPress={() => setRating(r => Math.min(3, r + 1))}
            />
          </pixiContainer>
        </pixiContainer>

        {/* Section: Icons & Badges */}
        <PixiLabel text="Icons & Badges" variant="subtitle" y={430} />
        <PixiDivider y={458} width={contentWidth} />

        <pixiContainer y={470}>
          <PixiIcon icon="starFilled" size={32} x={0} />
          <PixiIcon icon="fire" size={32} x={40} />
          <PixiIcon icon="trophy" size={32} x={80} />
          <PixiIcon icon="cube" size={32} x={120} />
          <PixiIcon icon="scroll" size={32} x={160} />
          <PixiIcon icon="shop" size={32} x={200} />
          <PixiIcon icon="crown" size={32} x={240} />
          <PixiIcon icon="lock" size={32} x={280} tint={0x888888} />
          
          <pixiContainer x={340}>
            <PixiLabel text="Badges:" variant="body" />
            <PixiBadge x={70} count={notifCount} />
            <PixiBadge x={100} count={99} backgroundColor={0x3B82F6} />
          </pixiContainer>
        </pixiContainer>

        {/* Section: Typography */}
        <PixiLabel text="Typography" variant="subtitle" y={530} />
        <PixiDivider y={558} width={contentWidth} />

        <pixiContainer y={570}>
          <PixiLabel text="Title Style" variant="title" />
          <PixiLabel text="Subtitle Style" variant="subtitle" y={35} />
          <PixiLabel text="Body text for regular content" variant="body" y={65} />
          <PixiLabel text="Caption for small details" variant="caption" y={90} />
          <PixiLabel 
            text="Word wrapped text that spans multiple lines when the content is too long to fit on a single line" 
            variant="body" 
            y={110}
            wordWrapWidth={contentWidth}
          />
        </pixiContainer>

        {/* Section: Modal Test */}
        <PixiLabel text="Modals" variant="subtitle" y={700} />
        <PixiDivider y={728} width={contentWidth} />

        <pixiContainer y={740}>
          <PixiButton
            label="Show Confirm"
            variant="orange"
            width={140}
            onPress={() => setShowConfirm(true)}
          />
        </pixiContainer>

        {/* Section: Animations */}
        <PixiLabel text="Interactions" variant="subtitle" y={810} />
        <PixiDivider y={838} width={contentWidth} />

        <pixiContainer y={850}>
          <PixiLabel text="Try hovering and clicking buttons!" variant="body" />
          <PixiLabel text="Scroll this container with mouse wheel or drag" variant="caption" y={25} />
        </pixiContainer>
      </PixiScrollContainer>

      {/* Confirm Modal */}
      {showConfirm && (
        <PixiConfirmModal
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          isOpen={showConfirm}
          title="Confirm Action"
          message="Are you sure you want to proceed with this action?"
          confirmLabel="Yes, Do It"
          cancelLabel="Cancel"
          onConfirm={() => {
            console.log('Confirmed!');
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
          confirmVariant="green"
        />
      )}
    </PixiModal>
  );
}

export default UIKitDemo;
