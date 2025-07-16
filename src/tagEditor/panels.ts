// SECTION: 📑 Tag Editor Panel Management
// EXPLANATION: 💬 Handles VS Code panel creation, lifecycle, and message routing
// WHY: ❓ Separates panel management from content generation for clean architecture

import * as vscode from "vscode";
import { CustomTagForEditor, WebviewMessage } from "./types";
import { createWebviewOptions, getBetterCommentTags } from "./utils";
import { generateTagEditorHTML, generateLanguageEditorHTML } from "./webview";

/**
 * WHAT_THIS_DO: 🤔 Main panel class for managing tag editor webview
 * WHY: ❓ Encapsulates all panel-related functionality for better organization
 * ARCHITECTURE: 🏗️ Follows VS Code webview panel lifecycle patterns
 */
export class TagEditorPanel {
  private static readonly viewType = "tagEditor";
  private static readonly title = "Comment Tags Editor";
  private static currentPanel: TagEditorPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _disposables: vscode.Disposable[] = [];

  /**
   * WHAT_THIS_DO: 🤔 Creates or shows existing tag editor panel
   * WHY: ❓ Ensures only one tag editor instance exists at a time
   * PATTERN: 🎯 Singleton pattern for panel management
   * @param extensionUri - Extension's URI for resource access
   */
  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    // If we already have a panel, show it
    if (TagEditorPanel.currentPanel) {
      TagEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      TagEditorPanel.viewType,
      TagEditorPanel.title,
      column || vscode.ViewColumn.One,
      createWebviewOptions(extensionUri)
    );

    TagEditorPanel.currentPanel = new TagEditorPanel(panel, extensionUri);
  }

  /**
   * WHAT_THIS_DO: 🤔 Kills any existing panel instance
   * WHY: ❓ Provides cleanup method for command handlers
   * CLEANUP: 🧹 Properly disposes of resources
   */
  public static kill(): void {
    TagEditorPanel.currentPanel?.dispose();
    TagEditorPanel.currentPanel = undefined;
  }

  /**
   * WHAT_THIS_DO: 🤔 Reveals existing panel if available
   * WHY: ❓ Brings panel to focus without creating new instance
   * UX: 👤 Improves user experience by managing window focus
   */
  public static revealOrCreate(extensionUri: vscode.Uri): void {
    if (TagEditorPanel.currentPanel) {
      TagEditorPanel.currentPanel._panel.reveal();
    } else {
      TagEditorPanel.createOrShow(extensionUri);
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this._handleMessage(message),
      null,
      this._disposables
    );
  }

  /**
   * WHAT_THIS_DO: 🤔 Handles disposal of panel resources
   * WHY: ❓ Ensures proper cleanup when panel is closed
   * MEMORY: 💾 Prevents memory leaks by disposing subscriptions
   */
  public dispose(): void {
    TagEditorPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * WHAT_THIS_DO: 🤔 Updates the webview HTML content
   * WHY: ❓ Refreshes interface with current tag configuration
   * PERFORMANCE: ⏱️ Only updates when panel is visible
   */
  private async _update(): Promise<void> {
    const webview = this._panel.webview;

    // Load custom tags from workspace configuration
    const customTags = await this._loadCustomTags();

    // Generate and set the HTML content
    this._panel.webview.html = generateTagEditorHTML(customTags);
  }

  /**
   * WHAT_THIS_DO: 🤔 Handles messages received from webview
   * WHY: ❓ Processes user actions and updates configuration
   * SECURITY: 🔒 Validates message structure before processing
   * @param message - Message from webview containing command and data
   */
  private async _handleMessage(message: WebviewMessage): Promise<void> {
    try {
      switch (message.command) {
        case "saveTags":
          await this._saveCustomTags(message.tags || []);
          vscode.window.showInformationMessage("Custom tags saved successfully!");
          break;

        case "loadTags":
          const customTags = await this._loadCustomTags();
          this._panel.webview.postMessage({
            command: "tagsLoaded",
            tags: customTags,
          });
          break;

        case "resetTags":
          await this._resetCustomTags();
          vscode.window.showInformationMessage("Custom tags reset to defaults!");
          this._update(); // Refresh the view
          break;

        default:
          console.warn(`Unknown command received: ${message.command}`);
      }
    } catch (error) {
      console.error("Error handling webview message:", error);
      vscode.window.showErrorMessage(
        `Error processing tag editor action: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * WHAT_THIS_DO: 🤔 Loads custom tags from workspace configuration
   * WHY: ❓ Retrieves current user-defined tag settings
   * CONFIG: ⚙️ Accesses VS Code configuration API safely
   * @returns Promise<CustomTagForEditor[]> - Array of custom tag configurations
   */
  private async _loadCustomTags(): Promise<CustomTagForEditor[]> {
    try {
      const config = vscode.workspace.getConfiguration("better-comments");
      const customTags = config.get<CustomTagForEditor[]>("customTags", []);

      // Ensure all tags have required properties with defaults
      return customTags.map((tag) => ({
        tag: tag.tag || "",
        color: tag.color || "#FFFFFF",
        backgroundColor: tag.backgroundColor || "transparent",
        strikethrough: tag.strikethrough || false,
        underline: tag.underline || false,
        bold: tag.bold || false,
        italic: tag.italic || false,
        emoji: tag.emoji || "",
        useEmoji: tag.useEmoji !== false, // Default to true
      }));
    } catch (error) {
      console.error("Error loading custom tags:", error);
      return [];
    }
  }

  /**
   * WHAT_THIS_DO: 🤔 Saves custom tags to workspace configuration
   * WHY: ❓ Persists user changes to VS Code settings
   * CONFIG: ⚙️ Updates configuration with validation
   * @param tags - Array of custom tags to save
   */
  private async _saveCustomTags(tags: CustomTagForEditor[]): Promise<void> {
    try {
      // Validate and clean tags before saving
      const validTags = tags.filter((tag) => tag.tag && tag.tag.trim() !== "");

      const config = vscode.workspace.getConfiguration("better-comments");
      await config.update("customTags", validTags, vscode.ConfigurationTarget.Workspace);

      // Trigger decoration refresh if extension is active
      vscode.commands.executeCommand("comment-chameleon.refreshDecorations");
    } catch (error) {
      console.error("Error saving custom tags:", error);
      throw new Error("Failed to save custom tags. Please check your workspace settings.");
    }
  }

  /**
   * WHAT_THIS_DO: 🤔 Resets custom tags to empty array
   * WHY: ❓ Provides reset functionality for users
   * CONFIG: ⚙️ Clears custom tag configuration
   */
  private async _resetCustomTags(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration("better-comments");
      await config.update("customTags", [], vscode.ConfigurationTarget.Workspace);

      // Trigger decoration refresh
      vscode.commands.executeCommand("comment-chameleon.refreshDecorations");
    } catch (error) {
      console.error("Error resetting custom tags:", error);
      throw new Error("Failed to reset custom tags.");
    }
  }
}

/**
 * WHAT_THIS_DO: 🤔 Panel class for managing language-specific editor
 * WHY: ❓ Handles language configuration interface separately from tags
 * ARCHITECTURE: 🏗️ Follows same pattern as TagEditorPanel for consistency
 */
export class LanguageEditorPanel {
  private static readonly viewType = "languageEditor";
  private static readonly title = "Language Configuration Editor";
  private static currentPanel: LanguageEditorPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _disposables: vscode.Disposable[] = [];

  /**
   * WHAT_THIS_DO: 🤔 Creates or shows existing language editor panel
   * WHY: ❓ Manages language configuration interface
   * PATTERN: 🎯 Singleton pattern consistent with TagEditorPanel
   * @param extensionUri - Extension's URI for resource access
   */
  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (LanguageEditorPanel.currentPanel) {
      LanguageEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      LanguageEditorPanel.viewType,
      LanguageEditorPanel.title,
      column || vscode.ViewColumn.One,
      createWebviewOptions(extensionUri)
    );

    LanguageEditorPanel.currentPanel = new LanguageEditorPanel(panel, extensionUri);
  }

  /**
   * WHAT_THIS_DO: 🤔 Kills any existing language editor panel
   * WHY: ❓ Provides cleanup method for command handlers
   * CLEANUP: 🧹 Properly disposes of resources
   */
  public static kill(): void {
    LanguageEditorPanel.currentPanel?.dispose();
    LanguageEditorPanel.currentPanel = undefined;
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this._handleMessage(message),
      null,
      this._disposables
    );
  }

  public dispose(): void {
    LanguageEditorPanel.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _update(): Promise<void> {
    // Get better-comments configuration for languages
    const betterCommentTags = getBetterCommentTags();
    this._panel.webview.html = generateLanguageEditorHTML(betterCommentTags);
  }

  private async _handleMessage(message: WebviewMessage): Promise<void> {
    try {
      switch (message.command) {
        case "saveLanguages":
          await this._saveLanguageConfiguration(message.languages || []);
          vscode.window.showInformationMessage("Language configuration saved successfully!");
          break;

        default:
          console.warn(`Unknown command received: ${message.command}`);
      }
    } catch (error) {
      console.error("Error handling language editor message:", error);
      vscode.window.showErrorMessage(
        `Error processing language editor action: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * WHAT_THIS_DO: 🤔 Saves language configuration to workspace settings
   * WHY: ❓ Persists language-specific comment syntax settings
   * CONFIG: ⚙️ Updates better-comments.multilineComments configuration
   * @param languages - Array of language configurations to save
   */
  private async _saveLanguageConfiguration(languages: any[]): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration("better-comments");
      await config.update("multilineComments", languages, vscode.ConfigurationTarget.Workspace);

      // Trigger decoration refresh
      vscode.commands.executeCommand("comment-chameleon.refreshDecorations");
    } catch (error) {
      console.error("Error saving language configuration:", error);
      throw new Error("Failed to save language configuration.");
    }
  }
}
