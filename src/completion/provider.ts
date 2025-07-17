// SECTION: 📑 Intelligent Auto-Completion Provider
// EXPLANATION: 💬 Advanced completion system for comment tags with context awareness
// WHY: ❓ Provides intelligent suggestions for comment tags based on context

import * as vscode from "vscode";
import { CustomTag } from "../types";
import { PREDEFINED_COMMENT_TAGS, shouldUseEmoji } from "../config";
import { getCommentPrefix, getCommentSuffix, SUPPORTED_LANGUAGES } from "../languages";
import { analyzeCommentContext } from "./context";

/**
 * WHAT_THIS_DO: 🤔 Creates and configures the completion provider for comment tags
 * WHY: ❓ Centralizes completion provider setup for better organization
 * @returns VS Code completion item provider
 */
export function createCompletionProvider(): vscode.CompletionItemProvider {
  return {
    /**
     * WHAT_THIS_DO: 🤔 Analyzes context and provides relevant comment tag suggestions
     * WHY: ❓ Context-aware completion improves accuracy and user experience
     * @param document - Current text document
     * @param position - Cursor position for completion
     * @returns Array of completion items or empty array
     */
    provideCompletionItems(
      document: vscode.TextDocument, 
      position: vscode.Position
    ): vscode.CompletionItem[] {
      const line = document.lineAt(position);
      const lineText = line.text;
      const languageId = document.languageId;

      // PERFORMANCE: ⏱️ Get text before cursor for context analysis
      const textBeforeCursor = lineText.substring(0, position.character);
      
      // WHAT_THIS_DO: 🤔 Analyze if we're in a valid comment context
      const commentContext = analyzeCommentContext(textBeforeCursor, languageId);
      
      // OPTIMIZE: 🚀 Early return if not in comment context to save processing
      if (!commentContext.shouldSuggest) {
        return [];
      }

      // CONTEXT: 🌐 Retrieve user configuration for custom tags
      const config = vscode.workspace.getConfiguration("commentChameleon");
      const customTags = config.get<CustomTag[]>("customTags") || [];

      // WHAT_THIS_DO: 🤔 Merge predefined and custom tags for comprehensive suggestions
      const allTags = [...PREDEFINED_COMMENT_TAGS, ...customTags];

      // PERFORMANCE: ⏱️ Filter tags based on partial user input
      const partialTag = commentContext.partialTag.toLowerCase();
      
      // OPTIMIZE: 🚀 Only show suggestions if we have a meaningful partial tag or are at comment start
      if (partialTag.length > 0 && partialTag.length < 2) {
        // Don't show suggestions for single characters unless it's clearly a tag start
        return [];
      }
      
      const filteredTags = allTags.filter((tagObj) =>
        tagObj.tag.toLowerCase().includes(partialTag) || partialTag === ""
      );

      // WHAT_THIS_DO: 🤔 Transform tag objects into VS Code completion items
      return filteredTags.map((tagObj: CustomTag): vscode.CompletionItem => {
        const item = new vscode.CompletionItem(
          tagObj.tag,
          vscode.CompletionItemKind.Snippet
        );

        // CONTEXT: 🌐 Generate appropriate snippet based on comment context
        let snippetBody: string;
        
        if (commentContext.isNewComment) {
          // WHAT_THIS_DO: 🤔 Create complete comment structure for new comments
          const commentPrefix = getCommentPrefix(languageId);
          const commentSuffix = getCommentSuffix(languageId);
          const emojiPart = shouldUseEmoji(tagObj) ? ` ${tagObj.emoji || ""}` : "";
          snippetBody = `${commentPrefix} ${tagObj.tag}${emojiPart} $1${commentSuffix}`;
        } else {
          // WHAT_THIS_DO: 🤔 Insert only tag within existing comment
          const emojiPart = shouldUseEmoji(tagObj) ? ` ${tagObj.emoji || ""}` : "";
          snippetBody = `${tagObj.tag}${emojiPart} $1`;
        }

        // PERFORMANCE: ⏱️ Configure completion item properties
        item.insertText = new vscode.SnippetString(snippetBody);
        item.detail = "Comment Chameleon Tag";
        item.documentation = `Insert the ${tagObj.tag} tag${tagObj.emoji ? ` ${tagObj.emoji}` : ""}`;
        
        // OPTIMIZE: 🚀 Prioritize prefix matches for better relevance
        if (tagObj.tag.toLowerCase().startsWith(partialTag)) {
          item.sortText = `0_${tagObj.tag}`; // Higher priority for prefix matches
        } else {
          item.sortText = `1_${tagObj.tag}`; // Lower priority for contains matches
        }
        
        return item;
      });
    }
  };
}

/**
 * WHAT_THIS_DO: 🤔 Registers the completion provider with VS Code
 * WHY: ❓ Centralizes provider registration for better organization
 * @param context - VS Code extension context
 */
export function registerCompletionProvider(context: vscode.ExtensionContext): void {
  const provider = createCompletionProvider();
  
  // CONTEXT: 🌐 Trigger characters for intelligent completion activation
  const triggerCharacters = [
    "//", // Single-line comments (JavaScript, C-family)
    "#",  // Python, shell scripts
    "<",  // HTML, XML comments
    "*",  // Multi-line C-style comments
    ":"   // After tag names - removed space to prevent excessive triggering
  ];

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SUPPORTED_LANGUAGES,
      provider,
      ...triggerCharacters
    )
  );
}
