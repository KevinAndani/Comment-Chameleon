// SECTION: 📑 Utility Functions
// EXPLANATION: 💬 Shared utility functions used across the extension
// WHY: ❓ Centralizes common functionality to avoid duplication

/**
 * WHAT_THIS_DO: 🤔 Escapes special regex characters to prevent regex injection
 * WHY: ❓ Ensures safe regex construction with user-provided strings
 * SECURITY: 🔒 Prevents regex injection attacks from user input
 * @param str - String to escape for regex use
 * @returns Safely escaped string for regex patterns
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// SECTION: 📑 Emoji Mapping System
// EXPLANATION: 💬 Functions for mapping tag names to appropriate emojis

/**
 * WHAT_THIS_DO: 🤔 Maps tag names to appropriate emoji characters
 * WHY: ❓ Provides fallback emojis when tags don't specify custom emojis
 * CONTEXT: 🌐 Enhances visual appeal and improves comment readability
 * @param tagName - Cleaned tag name without special characters
 * @returns Emoji character or default emoji if no mapping exists
 */
export function getEmojiForTag(tagName: string): string {
  const emojiMap: Record<string, string> = {
    todo: "📋",
    fixme: "🔧",
    bug: "🐛",
    hack: "⚡",
    note: "📝",
    info: "ℹ️",
    idea: "💡",
    debug: "🐞",
    why: "❓",
    what_this_do: "🤔",
    context: "🌐",
    critical: "⚠️",
    review: "👁️",
    optimize: "🚀",
    section: "📑",
    nextstep: "➡️",
    security: "🔒",
    performance: "⏱️",
    deprecated: "⛔",
    api: "🔌",
    explanation: "💬",
  };
  
  return emojiMap[tagName.toLowerCase()] || "💬";
}

// SECTION: 📑 Color Utilities
// EXPLANATION: 💬 Functions for color manipulation and conversion

export namespace ColorUtils {
  /**
   * WHAT_THIS_DO: 🤔 Parses hex color with alpha channel
   * @param hex - Hex color string with optional alpha
   * @returns Object with hex and alpha values
   */
  export function parseHexWithAlpha(hex: string): {
    hex: string;
    alpha: number;
  } {
    // SECURITY: 🔒 Validate hex format
    if (!hex.startsWith('#')) {
      return { hex: '#000000', alpha: 1 };
    }
    
    const cleanHex = hex.slice(1);
    
    if (cleanHex.length === 8) {
      // WHAT_THIS_DO: 🤔 Extract alpha from 8-character hex
      const alpha = parseInt(cleanHex.slice(6, 8), 16) / 255;
      return { hex: '#' + cleanHex.slice(0, 6), alpha };
    }
    
    return { hex, alpha: 1 };
  }

  /**
   * WHAT_THIS_DO: 🤔 Converts hex color with alpha to RGBA string
   * @param hex - Hex color string
   * @param alpha - Alpha value (0-1)
   * @returns RGBA color string
   */
  export function hexAlphaToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * WHAT_THIS_DO: 🤔 Converts hex and alpha to hex with alpha channel
   * @param hex - Hex color string
   * @param alpha - Alpha value (0-1)
   * @returns Hex color with alpha channel
   */
  export function toHexWithAlpha(hex: string, alpha: number): string {
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return hex + alphaHex;
  }
}
