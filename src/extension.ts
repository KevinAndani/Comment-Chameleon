// SECTION: 📑 Comment Chameleon Extension (Modularized)
// EXPLANATION: 💬 Main extension entry point with modular architecture
// WHY: ❓ Provides clean separation of concerns and better maintainability

import * as vscode from "vscode";
import { ExtensionState } from "./types";
import { registerCommands } from "./commands";
import { registerCompletionProvider } from "./completion";
import { triggerUpdateDecorations, clearAllDecorations } from "./decoration";
import { updateCustomTagSnippets } from "./snippets";
import { registerTagEditorCommands, disposeTagEditor } from "./tagEditorCommands";

// SECTION: 📑 Global Extension State
// EXPLANATION: 💬 Centralized state management for the extension
let extensionState: ExtensionState;

/**
 * WHAT_THIS_DO: 🤔 Initializes the extension state
 * WHY: ❓ Creates clean initial state for decoration management
 * @returns Initialized extension state object
 */
function initializeExtensionState(): ExtensionState {
  return {
    activeDecorationTypes: new Map(),
    decorationTimeout: undefined
  };
}

/**
 * WHAT_THIS_DO: 🤔 Sets up event listeners for the extension
 * WHY: ❓ Provides reactive functionality for real-time highlighting
 * @param context - VS Code extension context
 * @param state - Extension state for event handlers
 */
function setupEventListeners(context: vscode.ExtensionContext, state: ExtensionState): void {
  // WHAT_THIS_DO: 🤔 React to configuration changes for immediate updates
  // WHY: ❓ Ensures extension stays synchronized with user preferences
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        // PERFORMANCE: ⏱️ Only update if relevant configurations changed
        if (
          e.affectsConfiguration("commentChameleon.customTags") ||
          e.affectsConfiguration("commentChameleon.useEmojis")
        ) {
          // OPTIMIZE: 🚀 Clear and regenerate decorations for immediate visual update
          clearAllDecorations(state);
          
          if (vscode.window.activeTextEditor) {
            triggerUpdateDecorations(vscode.window.activeTextEditor, state, true);
          }
          
          // NEXT STEP: ➡️ Update snippets to reflect new configuration
          updateCustomTagSnippets(context);
        }
      }
    )
  );

  // WHAT_THIS_DO: 🤔 Handle active editor switching for multi-file support
  // WHY: ❓ Applies comment highlighting when user switches between files
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        // PERFORMANCE: ⏱️ Debounced update for smooth editor transitions
        triggerUpdateDecorations(editor, state);
      }
    })
  );

  // WHAT_THIS_DO: 🤔 React to document content changes for real-time highlighting
  // WHY: ❓ Updates decorations as user types or edits content
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      // OPTIMIZE: 🚀 Only update if the changed document is currently active
      if (
        vscode.window.activeTextEditor &&
        event.document === vscode.window.activeTextEditor.document
      ) {
        // PERFORMANCE: ⏱️ Debounced update to prevent excessive processing
        triggerUpdateDecorations(vscode.window.activeTextEditor, state);
      }
    })
  );
}

/**
 * WHAT_THIS_DO: 🤔 Activates the Comment Chameleon extension
 * WHY: ❓ Sets up commands, event listeners, and initial state
 * CONTEXT: 🌐 Called automatically by VS Code when extension loads
 * @param context - VS Code extension context for subscriptions and resources
 */
export function activate(context: vscode.ExtensionContext): void {
  // DEBUG: 🐞 Log activation for troubleshooting
  console.log("Comment Chameleon (Modularized) is now active");

  // SECTION: 📑 Initialize Extension State
  extensionState = initializeExtensionState();

  // SECTION: 📑 Initial Setup and State Initialization
  // PERFORMANCE: ⏱️ Apply decorations to active editor immediately for responsive UX
  if (vscode.window.activeTextEditor) {
    triggerUpdateDecorations(vscode.window.activeTextEditor, extensionState);
  }

  // NEXT STEP: ➡️ Generate code snippets for enhanced autocomplete
  updateCustomTagSnippets(context);

  // SECTION: 📑 Register Extension Components
  // EXPLANATION: 💬 Initialize all modular components

  // WHAT_THIS_DO: 🤔 Register all VS Code commands
  registerCommands(context, extensionState);

  // WHAT_THIS_DO: 🤔 Register tag editor commands and panels
  registerTagEditorCommands(context);

  // WHAT_THIS_DO: 🤔 Register intelligent completion provider
  registerCompletionProvider(context);

  // WHAT_THIS_DO: 🤔 Set up reactive event listeners
  setupEventListeners(context, extensionState);

  // DEBUG: 🐞 Display available commands for development verification
  console.log(
    "Available commands:",
    vscode.commands
      .getCommands(true)
      .then((commands) =>
        commands.filter((cmd) => cmd.includes("comment-chameleon"))
      )
      .then((commands) => console.log("Filtered commands:", commands))
  );
}

/**
 * WHAT_THIS_DO: 🤔 Deactivates the extension and cleans up resources
 * WHY: ❓ Ensures proper cleanup when extension is disabled or unloaded
 * CONTEXT: 🌐 Called automatically by VS Code during extension shutdown
 */
export function deactivate(): void {
  // MEMORY: 🧠 Clean up decorations to prevent memory leaks
  if (extensionState) {
    clearAllDecorations(extensionState);
    
    // WHAT_THIS_DO: 🤔 Clear any pending timeout
    if (extensionState.decorationTimeout) {
      clearTimeout(extensionState.decorationTimeout);
    }
  }
  
  // CLEANUP: 🧹 Dispose tag editor resources
  disposeTagEditor();
  
  console.log("Comment Chameleon (Modularized) deactivated");
}
