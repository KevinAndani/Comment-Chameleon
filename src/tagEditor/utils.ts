// SECTION: 📑 Tag Editor Utility Functions
// EXPLANATION: 💬 Shared utility functions for the tag editor modules
// WHY: ❓ Centralizes common functionality used across editor components

import * as vscode from "vscode";

/**
 * WHAT_THIS_DO: 🤔 Generates a cryptographically secure nonce for webview CSP
 * WHY: ❓ Provides security for webview content by preventing script injection
 * SECURITY: 🔒 Uses random characters to create unique nonce for each webview load
 * @returns Secure nonce string for Content Security Policy
 */
export function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * WHAT_THIS_DO: 🤔 Retrieves better-comments extension tags for potential integration
 * WHY: ❓ Allows users to import existing better-comments configuration
 * CONTEXT: 🌐 Provides compatibility with the popular better-comments extension
 * @returns Array of better-comments tags or empty array if not found
 */
export function getBetterCommentTags(): any[] {
  const config = vscode.workspace.getConfiguration("better-comments");
  const tags = config.get("tags") || [];
  return Array.isArray(tags) ? tags : [];
}

/**
 * WHAT_THIS_DO: 🤔 Creates standard webview options for tag editor panels
 * WHY: ❓ Ensures consistent webview configuration across editor panels
 * SECURITY: 🔒 Sets appropriate security restrictions for webview content
 * @param extensionUri - Extension URI for resource access
 * @returns Standard webview options object
 */
export function createWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions & vscode.WebviewPanelOptions {
  return {
    enableScripts: true,
    localResourceRoots: [
      vscode.Uri.joinPath(extensionUri, "media"),
      vscode.Uri.joinPath(extensionUri, "out"),
    ],
  };
}
