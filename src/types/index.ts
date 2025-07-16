// SECTION: 📑 Core Type Definitions and Interfaces
// EXPLANATION: 💬 Centralized type definitions for the Comment Chameleon extension
// WHY: ❓ Provides type safety and standardization across all modules

import * as vscode from "vscode";

/**
 * WHAT_THIS_DO: 🤔 Defines structure for comment tag configuration
 * WHY: ❓ Provides type safety and standardization for tag properties
 * CONTEXT: 🌐 Used throughout extension for tag styling and behavior
 */
export interface CustomTag {
  tag: string;                // CONTEXT: 🌐 Tag text (e.g., "TODO:", "FIXME:")
  color?: string;             // CONTEXT: 🌐 Text color in hex format
  strikethrough?: boolean;    // CONTEXT: 🌐 Enable strikethrough decoration
  underline?: boolean;        // CONTEXT: 🌐 Enable underline decoration
  backgroundColor?: string;   // CONTEXT: 🌐 Background color for highlighting
  bold?: boolean;             // CONTEXT: 🌐 Enable bold font weight
  italic?: boolean;           // CONTEXT: 🌐 Enable italic font style
  emoji?: string;             // CONTEXT: 🌐 Emoji character for visual enhancement
  useEmoji?: boolean;         // CONTEXT: 🌐 Tag-specific emoji override setting
}

/**
 * WHAT_THIS_DO: 🤔 Defines structure for user-defined programming languages
 * INFO: ℹ️ Allows users to add comment syntax for unsupported languages
 */
export interface UserDefinedLanguage {
  languageName: string;      // CONTEXT: 🌐 Language identifier (e.g., "rust", "go")
  singleLinePrefix: string;  // CONTEXT: 🌐 Single-line comment syntax (e.g., "//", "#")
  multiLinePrefix: string;   // CONTEXT: 🌐 Multi-line comment start (e.g., "/*", "<!--")
  multiLineSuffix: string;   // CONTEXT: 🌐 Multi-line comment end (e.g., "*/", "-->")
}

/**
 * WHAT_THIS_DO: 🤔 Defines VS Code snippet structure
 * WHY: ❓ Ensures proper snippet file generation and VS Code compatibility
 * CONTEXT: 🌐 Used for generating autocomplete snippets for comment tags
 */
export interface Snippet {
  prefix: string;       // CONTEXT: 🌐 Trigger text for autocomplete
  scope?: string;       // CONTEXT: 🌐 Language scope limitation (optional)
  body: string[];       // CONTEXT: 🌐 Snippet content with placeholders
  description: string;  // CONTEXT: 🌐 Human-readable description
}

/**
 * WHAT_THIS_DO: 🤔 Interface defining comment context analysis results
 * WHY: ❓ Structured data for context-aware completion decisions
 * INFO: ℹ️ Used by completion provider to determine suggestion behavior
 */
export interface CommentContext {
  shouldSuggest: boolean;  // CONTEXT: 🌐 Whether to show tag suggestions
  isNewComment: boolean;   // CONTEXT: 🌐 True if starting new comment, false if continuing
  partialTag: string;      // CONTEXT: 🌐 User's partial input for filtering
  commentPrefix?: string;  // CONTEXT: 🌐 Detected comment syntax for language
}

/**
 * WHAT_THIS_DO: 🤔 Interface defining multi-line comment pattern structure
 * WHY: ❓ Standardizes detection of block comments across different languages
 * INFO: ℹ️ Used by decoration engine to find tags within multi-line comments
 */
export interface MultiLineCommentPattern {
  name: string;                // CONTEXT: 🌐 Human-readable pattern identifier
  startDelimiterRegex: string; // CONTEXT: 🌐 Regex for comment start (e.g., /\/\*/)
  endDelimiterRegex: string;   // CONTEXT: 🌐 Regex for comment end (e.g., /\*\//)
  tagAtStart: true;            // INFO: ℹ️ Whether tag must appear immediately after start delimiter
}

/**
 * WHAT_THIS_DO: 🤔 Extension global state interface
 * WHY: ❓ Centralizes state management for better organization
 * CONTEXT: 🌐 Manages decoration types and debouncing timeout
 */
export interface ExtensionState {
  activeDecorationTypes: Map<string, vscode.TextEditorDecorationType>;
  decorationTimeout?: NodeJS.Timeout;
}
