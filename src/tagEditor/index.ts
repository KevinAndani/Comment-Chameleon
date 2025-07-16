// SECTION: 📑 Tag Editor Module Entry Point
// EXPLANATION: 💬 Main export file for tag editor functionality
// WHY: ❓ Provides clean API interface for importing tag editor components

export { CustomTagForEditor, WebviewMessage } from "./types";
export { getNonce, getBetterCommentTags, createWebviewOptions } from "./utils";
export { generateTagEditorHTML, generateLanguageEditorHTML } from "./webview";
export { TagEditorPanel, LanguageEditorPanel } from "./panels";

/**
 * WHAT_THIS_DO: 🤔 Re-exports all tag editor functionality
 * WHY: ❓ Provides centralized access point for all tag editor components
 * ARCHITECTURE: 🏗️ Enables clean imports from other modules
 * 
 * USAGE_EXAMPLE: 🔧
 * ```typescript
 * import { TagEditorPanel, CustomTagForEditor } from '../tagEditor';
 * ```
 */
