// SECTION: 📑 Tag Editor Types and Interfaces
// EXPLANATION: 💬 Type definitions specific to the tag editor functionality
// WHY: ❓ Provides type safety for editor-specific data structures

/**
 * WHAT_THIS_DO: 🤔 Interface for custom tags used in the editor
 * WHY: ❓ Provides type safety for tag editor specific properties
 * CONTEXT: 🌐 Used by the tag editor webview and panel
 */
export interface CustomTagForEditor {
  tag: string;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  emoji?: string;
  useEmoji?: boolean;
}

/**
 * WHAT_THIS_DO: 🤔 Interface for webview message commands
 * WHY: ❓ Type safety for communication between webview and extension
 * CONTEXT: 🌐 Used for message passing in both tag and language editors
 */
export interface WebviewMessage {
  command: string;
  tags?: CustomTagForEditor[];
  languages?: any[];
  language?: {
    languageName: string;
    singleLinePrefix: string;
    multiLinePrefix: string;
    multiLineSuffix: string;
  };
}
