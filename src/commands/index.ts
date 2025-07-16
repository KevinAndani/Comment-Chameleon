// SECTION: 📑 VS Code Command Handlers
// EXPLANATION: 💬 Centralized command implementations for the extension
// WHY: ❓ Separates command logic from main extension file

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ExtensionState } from "../types";
import { clearAllDecorations, triggerUpdateDecorations } from "../decoration";
import { updateCustomTagSnippets } from "../snippets";
import { TagEditorPanel, LanguageEditorPanel } from "../tagEditor";

/**
 * WHAT_THIS_DO: 🤔 Handles the apply styles command
 * WHY: ❓ Allows users to force-refresh styles when issues occur
 * @param state - Extension state for decoration management
 * @param context - VS Code extension context
 */
export function handleApplyStylesCommand(state: ExtensionState, context: vscode.ExtensionContext): void {
  // PERFORMANCE: ⏱️ Clear old decorations to prevent memory leaks
  clearAllDecorations(state);
  
  // OPTIMIZE: 🚀 Force immediate update for responsive user feedback
  if (vscode.window.activeTextEditor) {
    triggerUpdateDecorations(vscode.window.activeTextEditor, state, true);
  }
  
  // NEXT STEP: ➡️ Regenerate snippets with latest configuration
  updateCustomTagSnippets(context);
  
  // INFO: ℹ️ Provide user feedback for successful operation
  vscode.window.showInformationMessage(
    "Comment Chameleon: Styles refreshed successfully!"
  );
}

/**
 * WHAT_THIS_DO: 🤔 Handles the edit tags command
 * WHY: ❓ Provides GUI for managing custom comment tags
 * @param context - VS Code extension context
 */
export function handleEditTagsCommand(context: vscode.ExtensionContext): void {
  TagEditorPanel.createOrShow(context.extensionUri);
}

/**
 * WHAT_THIS_DO: 🤔 Handles the edit languages command
 * WHY: ❓ Provides GUI for managing custom language definitions
 * @param context - VS Code extension context
 */
export function handleEditLanguagesCommand(context: vscode.ExtensionContext): void {
  LanguageEditorPanel.createOrShow(context.extensionUri);
}

/**
 * WHAT_THIS_DO: 🤔 Handles the debug check snippets command
 * WHY: ❓ Provides debugging information about generated snippet files
 * @param context - VS Code extension context
 */
export function handleCheckSnippetsCommand(context: vscode.ExtensionContext): void {
  const snippetsDir = path.join(context.extensionPath, "snippets");
  
  // SECURITY: 🔒 Check if directory exists before reading
  if (!fs.existsSync(snippetsDir)) {
    vscode.window.showInformationMessage("Snippets directory not found.");
    return;
  }
  
  const snippetFiles = fs.readdirSync(snippetsDir);

  // INFO: ℹ️ Display snippet file count and names to user
  vscode.window.showInformationMessage(
    `Found ${snippetFiles.length} snippet files: ${snippetFiles.join(", ")}`
  );

  // DEBUG: 🐞 Log sample snippet content for development verification
  if (snippetFiles.includes("general-custom.code-snippets")) {
    const content = fs.readFileSync(
      path.join(snippetsDir, "general-custom.code-snippets"),
      "utf8"
    );
    console.log("Sample snippet content:", content);
  }
}

/**
 * WHAT_THIS_DO: 🤔 Registers all extension commands with VS Code
 * WHY: ❓ Centralizes command registration for better organization
 * @param context - VS Code extension context
 * @param state - Extension state for command handlers
 */
export function registerCommands(context: vscode.ExtensionContext, state: ExtensionState): void {
  // API: 🔌 Command to manually refresh comment highlighting
  const applyStylesCommand = vscode.commands.registerCommand(
    "comment-chameleon.applyStyles",
    () => handleApplyStylesCommand(state, context)
  );

  // API: 🔌 Command to open tag editor interface
  const editTagsCommand = vscode.commands.registerCommand(
    "comment-chameleon.editTags",
    () => handleEditTagsCommand(context)
  );

  // API: 🔌 Command to open language editor interface
  const editLanguagesCommand = vscode.commands.registerCommand(
    "comment-chameleon.editLanguages",
    () => handleEditLanguagesCommand(context)
  );

  // API: 🔌 Development command to check snippet file status
  const checkSnippetsCommand = vscode.commands.registerCommand(
    "comment-chameleon.checkSnippets",
    () => handleCheckSnippetsCommand(context)
  );

  // SECURITY: 🔒 Register commands with extension context for proper cleanup
  context.subscriptions.push(
    applyStylesCommand,
    editTagsCommand,
    editLanguagesCommand,
    checkSnippetsCommand
  );
}
