/**
 * Share Hook for Native and Web
 * 
 * Provides native share sheet on iOS/Android and Web Share API fallback.
 * Used for sharing game scores, achievements, and referral links.
 * 
 * Usage:
 * const { shareScore, shareAchievement, shareReferral, canShare } = useShare();
 * 
 * // Share a score
 * await shareScore({ level: 25, score: 1500, cubesEarned: 50 });
 * 
 * // Share an achievement
 * await shareAchievement("Combo Master");
 */

import { Share, ShareResult } from "@capacitor/share";
import { useCallback } from "react";
import { isNative } from "../utils/capacitorUtils";

// Game website URL
const GAME_URL = "https://zkube.xyz";

export interface ShareScoreOptions {
  level: number;
  score: number;
  cubesEarned?: number;
}

export interface ShareResult {
  shared: boolean;
  platform?: string;
}

export const useShare = () => {
  /**
   * Check if sharing is available
   */
  const canShare = useCallback(async (): Promise<boolean> => {
    if (isNative) {
      // Native always supports sharing
      return true;
    }
    
    // Check Web Share API availability
    return typeof navigator !== "undefined" && !!navigator.share;
  }, []);

  /**
   * Share a game score
   */
  const shareScore = useCallback(async (options: ShareScoreOptions): Promise<ShareResult> => {
    const { level, score, cubesEarned } = options;
    
    let text = `I reached level ${level} with ${score} points in zKube!`;
    if (cubesEarned && cubesEarned > 0) {
      text += ` Earned ${cubesEarned} CUBE!`;
    }
    text += " Can you beat it?";

    return shareContent({
      title: "zKube Score",
      text,
      url: GAME_URL,
      dialogTitle: "Share your zKube score",
    });
  }, []);

  /**
   * Share an achievement unlock
   */
  const shareAchievement = useCallback(async (achievementName: string): Promise<ShareResult> => {
    const text = `I just unlocked the "${achievementName}" achievement in zKube!`;

    return shareContent({
      title: "zKube Achievement",
      text,
      url: GAME_URL,
      dialogTitle: "Share your achievement",
    });
  }, []);

  /**
   * Share a referral link
   */
  const shareReferral = useCallback(async (referralCode: string): Promise<ShareResult> => {
    const referralUrl = `${GAME_URL}?ref=${referralCode}`;
    const text = `Join me on zKube - an on-chain puzzle game! Use my referral link:`;

    return shareContent({
      title: "Play zKube",
      text,
      url: referralUrl,
      dialogTitle: "Invite friends to zKube",
    });
  }, []);

  /**
   * Share a level completion
   */
  const shareLevelComplete = useCallback(async (
    level: number,
    stars: number,
    bonusName?: string
  ): Promise<ShareResult> => {
    let text = `I completed level ${level} with ${stars} star${stars !== 1 ? "s" : ""} in zKube!`;
    if (bonusName) {
      text += ` Earned a ${bonusName} bonus!`;
    }

    return shareContent({
      title: "zKube Level Complete",
      text,
      url: GAME_URL,
      dialogTitle: "Share your progress",
    });
  }, []);

  /**
   * Share a combo achievement
   */
  const shareCombo = useCallback(async (linesCleared: number): Promise<ShareResult> => {
    const text = `I cleared ${linesCleared} lines in a single move in zKube! That's a ${getComboName(linesCleared)}!`;

    return shareContent({
      title: "zKube Combo",
      text,
      url: GAME_URL,
      dialogTitle: "Share your combo",
    });
  }, []);

  /**
   * Generic share content function
   */
  const shareContent = async (options: {
    title: string;
    text: string;
    url: string;
    dialogTitle: string;
  }): Promise<ShareResult> => {
    const { title, text, url, dialogTitle } = options;

    try {
      if (isNative) {
        // Use Capacitor Share plugin
        const result = await Share.share({
          title,
          text,
          url,
          dialogTitle,
        });

        return {
          shared: result.activityType !== undefined,
          platform: result.activityType,
        };
      } else if (navigator.share) {
        // Use Web Share API
        await navigator.share({
          title,
          text,
          url,
        });

        return { shared: true };
      } else {
        // Fallback: Copy to clipboard
        const fullText = `${text} ${url}`;
        await navigator.clipboard.writeText(fullText);

        return { shared: true, platform: "clipboard" };
      }
    } catch (error) {
      // User cancelled or share failed
      console.log("[useShare] Share cancelled or failed:", error);
      return { shared: false };
    }
  };

  /**
   * Get a name for combo based on lines cleared
   */
  const getComboName = (lines: number): string => {
    if (lines >= 9) return "MEGA COMBO";
    if (lines >= 7) return "SUPER COMBO";
    if (lines >= 5) return "GREAT COMBO";
    if (lines >= 4) return "COMBO";
    return "combo";
  };

  return {
    // Share functions
    shareScore,
    shareAchievement,
    shareReferral,
    shareLevelComplete,
    shareCombo,
    shareContent,
    
    // Utility
    canShare,
    
    // Platform detection
    isNative,
  };
};

export default useShare;
