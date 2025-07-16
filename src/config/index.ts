// SECTION: 📑 Configuration Management and Predefined Tags
// EXPLANATION: 💬 Centralized configuration handling and predefined tag definitions
// WHY: ❓ Separates configuration logic from main extension code

import * as vscode from "vscode";
import { CustomTag, UserDefinedLanguage } from "../types";

// SECTION: 📑 Predefined Comment Tag Definitions
// EXPLANATION: 💬 This array contains all built-in comment tags with their styling properties
// INFO: ℹ️ These tags provide default highlighting for common comment patterns
export const PREDEFINED_COMMENT_TAGS: CustomTag[] = [
  {
    // NOTE: 📝 General comment style for basic highlighting
    tag: "//",
    color: "#6272a4", // PERFORMANCE: ⏱️ Dracula theme comment color for consistency
    strikethrough: false,
    underline: false,
    backgroundColor: "transparent",
    // WARNING: Consider if this broad tag is needed for specific highlighting
  },
  {
    // EXPLANATION: 💬 Tag for explaining complex code sections
    tag: "EXPLANATION:",
    color: "#ff70b3",
    strikethrough: false,
    underline: false,
    backgroundColor: "transparent",
    emoji: "💬",
  },
  {
    // TODO: 📋 Standard task tracking tag
    tag: "TODO:",
    color: "#ffc66d",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📋",
  },
  {
    // FIXME: 🔧 Critical issues requiring immediate attention
    tag: "FIXME:",
    color: "#ff6e6e",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🔧",
  },
  {
    // BUG: 🐛 Known issues with background highlighting for visibility
    tag: "BUG:",
    color: "#f8f8f2",
    strikethrough: false,
    backgroundColor: "#bb80ff",
    emoji: "🐛",
  },
  {
    // HACK: ⚡ Temporary workarounds that need proper solutions
    tag: "HACK:",
    color: "#ffffa5",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "⚡",
  },
  {
    // NOTE: 📝 General informational comments
    tag: "NOTE:",
    color: "#94f0ff",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📝",
  },
  {
    // INFO: ℹ️ Informational tags for documentation
    tag: "INFO:",
    color: "#c798e6",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "ℹ️",
  },
  {
    // IDEA: 💡 Creative suggestions and improvements
    tag: "IDEA:",
    color: "#80ffce",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "💡",
  },
  {
    // DEBUG: 🐞 Debugging information and temporary code
    tag: "DEBUG:",
    color: "#ff2975",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🐞",
  },
  {
    // WHY: ❓ Explanations for design decisions
    tag: "WHY:",
    color: "#ff9580",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "❓",
  },
  {
    // WHAT_THIS_DO: 🤔 Code explanation for complex logic
    tag: "WHAT_THIS_DO:",
    color: "#FBBF24",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🤔",
  },
  {
    // CONTEXT: 🌐 Background information and context
    tag: "CONTEXT:",
    color: "#d8ff80",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🌐",
  },
  {
    // CRITICAL: ⚠️ High-priority issues requiring immediate attention
    tag: "CRITICAL:",
    color: "#FFFFFF",
    strikethrough: false,
    backgroundColor: "#9F1239",
    bold: true,
    emoji: "⚠️",
  },
  {
    // REVIEW: 👁️ Code sections requiring peer review
    tag: "REVIEW:",
    color: "#A5B4FC",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "👁️",
  },
  {
    // OPTIMIZE: 🚀 Performance optimization opportunities
    tag: "OPTIMIZE:",
    color: "#4ADE80",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🚀",
  },
  {
    // SECTION: 📑 Code organization and section markers
    tag: "SECTION:",
    color: "#f1a18e",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📑",
  },
  {
    // NEXT STEP: ➡️ Sequential development tasks
    tag: "NEXT STEP:",
    color: "#ba6645",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "➡️",
  },
  {
    // SECURITY: 🔒 Security-related considerations
    tag: "SECURITY:",
    color: "#cff028",
    strikethrough: false,
    backgroundColor: "#44475a",
    emoji: "🔒",
  },
  {
    // PERFORMANCE: ⏱️ Performance-related comments
    tag: "PERFORMANCE:",
    color: "#d7ffad",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "⏱️",
  },
  {
    // DEPRECATED: ⛔ Obsolete code marked for removal
    tag: "DEPRECATED:",
    color: "#8b8098",
    strikethrough: true,
    backgroundColor: "#44475a",
    emoji: "⛔",
  },
  {
    // API: 🔌 API-related documentation and endpoints
    tag: "API:",
    color: "#c798e6",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🔌",
  },
];

// SECTION: 📑 Configuration Helper Functions
// EXPLANATION: 💬 Functions to safely retrieve and parse user configuration

/**
 * WHAT_THIS_DO: 🤔 Retrieves only user-defined custom tags from VS Code configuration
 * WHY: ❓ Separates user tags from predefined tags for proper merging logic
 * @returns Array of user-defined custom tags
 */
export function getCustomTagsFromConfig(): CustomTag[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const rawCustomTags = config.get<CustomTag[]>("customTags");
  // SECURITY: 🔒 Validate array type to prevent runtime errors
  return Array.isArray(rawCustomTags) ? rawCustomTags : [];
}

/**
 * WHAT_THIS_DO: 🤔 Retrieves user-defined language configurations
 * WHY: ❓ Enables support for languages not built into the extension
 * @returns Array of user-defined languages
 */
export function getUserDefinedLanguages(): UserDefinedLanguage[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const languages = config.get<UserDefinedLanguage[]>("userDefinedLanguages");
  // SECURITY: 🔒 Type validation for configuration safety
  return Array.isArray(languages) ? languages : [];
}

/**
 * WHAT_THIS_DO: 🤔 Merges predefined and custom tags with proper precedence handling
 * WHY: ❓ Allows users to override predefined tags while maintaining defaults
 * PERFORMANCE: ⏱️ Filters out predefined tags that are redefined by users
 * @returns Combined array of all active tags (predefined + custom)
 */
export function getMergedTags(): CustomTag[] {
  const customTags = getCustomTagsFromConfig();
  
  // WHAT_THIS_DO: 🤔 Filter predefined tags to avoid duplicates with custom tags
  // WHY: ❓ Custom tags should override predefined ones with same tag text
  const predefinedTagsFiltered = PREDEFINED_COMMENT_TAGS.filter(
    (predefined) => !customTags.some((custom) => custom.tag === predefined.tag)
  );
  
  // CONTEXT: 🌐 Custom tags take precedence over predefined tags
  return [...predefinedTagsFiltered, ...customTags];
}

/**
 * WHAT_THIS_DO: 🤔 Determines if emoji should be displayed for a specific tag
 * WHY: ❓ Respects both global and tag-specific emoji preferences
 * CONTEXT: 🌐 Supports granular control over emoji visibility
 * @param tag - CustomTag object with potential emoji configuration
 * @returns Boolean indicating whether emoji should be shown
 */
export function shouldUseEmoji(tag: CustomTag): boolean {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);
  
  // WHAT_THIS_DO: 🤔 Priority: tag-specific setting > global setting
  // WHY: ❓ Allows users to enable/disable emojis per tag while maintaining global default
  const useEmoji = tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;
  
  // SECURITY: 🔒 Ensure both setting is enabled AND emoji exists
  return useEmoji && !!tag.emoji;
}
