// SECTION: 📑 Tag Editor - Modular Version
// EXPLANATION: 💬 This is the new modular implementation of the tag editor
// WHY: ❓ Replaces the monolithic tagEditor.ts with clean, maintainable modules

// ARCHITECTURE: 🏗️ This file serves as the main interface to the refactored tag editor
// The original tagEditor.ts (947 lines) has been split into focused modules:
// - types.ts: Interface definitions (CustomTagForEditor, WebviewMessage)
// - utils.ts: Utility functions (getNonce, getBetterCommentTags, createWebviewOptions)
// - webview.ts: HTML/CSS/JS generation for the webview interface
// - panels.ts: VS Code panel management and lifecycle

import * as vscode from "vscode";
import { TagEditorPanel, LanguageEditorPanel } from "./tagEditor/panels";

/**
 * WHAT_THIS_DO: 🤔 Registers tag editor commands with VS Code
 * WHY: ❓ Provides command handlers for the modular tag editor system
 * ARCHITECTURE: 🏗️ Clean interface replacing the monolithic approach
 * @param context - VS Code extension context for command registration
 */
export function registerTagEditorCommands(context: vscode.ExtensionContext): void {
  // Register the tag editor panel command
  const openTagEditorCommand = vscode.commands.registerCommand(
    "comment-chameleon.openTagEditor",
    () => {
      TagEditorPanel.createOrShow(context.extensionUri);
    }
  );

  // Register the language editor panel command
  const openLanguageEditorCommand = vscode.commands.registerCommand(
    "comment-chameleon.openLanguageEditor", 
    () => {
      LanguageEditorPanel.createOrShow(context.extensionUri);
    }
  );

  // Add commands to subscriptions for proper cleanup
  context.subscriptions.push(openTagEditorCommand, openLanguageEditorCommand);
}

/**
 * WHAT_THIS_DO: 🤔 Disposes of tag editor resources
 * WHY: ❓ Ensures proper cleanup when extension is deactivated
 * CLEANUP: 🧹 Prevents memory leaks and resource retention
 */
export function disposeTagEditor(): void {
  TagEditorPanel.kill();
  LanguageEditorPanel.kill();
}

// Export the panels for external usage
export { TagEditorPanel, LanguageEditorPanel } from "./tagEditor/panels";

/**
 * MODULARIZATION_SUMMARY: 📊
 * 
 * BEFORE: 📦 tagEditor.ts (947 lines)
 * - Monolithic file with all functionality mixed together
 * - Hard to maintain and test individual components
 * - No clear separation of concerns
 * 
 * AFTER: 🎯 Modular Structure (5 focused files)
 * ├── types.ts (35 lines) - Interface definitions
 * ├── utils.ts (89 lines) - Utility functions  
 * ├── webview.ts (425 lines) - UI content generation
 * ├── panels.ts (373 lines) - Panel management
 * └── index.ts (18 lines) - Module exports
 * 
 * TOTAL: 940 lines (same functionality, better organization)
 * 
 * BENEFITS: ✅
 * - Single Responsibility Principle enforced
 * - Easier testing and debugging
 * - Clear dependency management
 * - Better code reusability
 * - Improved maintainability
 */
