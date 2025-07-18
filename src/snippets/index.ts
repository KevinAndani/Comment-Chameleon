// SECTION: 📑 Production-Grade Snippet Management System
// EXPLANATION: 💬 Intelligent, context-aware snippet generation with programmatic VS Code integration
// WHY: ❓ Eliminates file-based snippet management in favor of dynamic completion providers

import * as vscode from "vscode";
import { CustomTag } from "../types";
import { getMergedTags } from "../config";

// SECTION: 📑 Language Configuration Registry
interface LanguageConfig {
  singleLineComment?: string;
  multiLineStart?: string;
  multiLineEnd?: string;
  id: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  javascript: { singleLineComment: '//', multiLineStart: '/*', multiLineEnd: '*/', id: 'javascript' },
  typescript: { singleLineComment: '//', multiLineStart: '/*', multiLineEnd: '*/', id: 'typescript' },
  c: { singleLineComment: '//', multiLineStart: '/*', multiLineEnd: '*/', id: 'c' },
  cpp: { singleLineComment: '//', multiLineStart: '/*', multiLineEnd: '*/', id: 'cpp' },
  csharp: { singleLineComment: '//', multiLineStart: '/*', multiLineEnd: '*/', id: 'csharp' },
  java: { singleLineComment: '//', multiLineStart: '/*', multiLineEnd: '*/', id: 'java' },
  python: { singleLineComment: '#', multiLineStart: '"""', multiLineEnd: '"""', id: 'python' },
  html: { multiLineStart: '<!--', multiLineEnd: '-->', id: 'html' },
  xml: { multiLineStart: '<!--', multiLineEnd: '-->', id: 'xml' },
  svg: { multiLineStart: '<!--', multiLineEnd: '-->', id: 'svg' }
};

// SECTION: 📑 Smart Completion Item Factory
class CommentSnippetProvider implements vscode.CompletionItemProvider {
  private allTags: CustomTag[] = [];

  constructor() {
    this.refreshTags();
  }

  refreshTags(): void {
    this.allTags = getMergedTags();
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.CompletionItem[] {
    const languageId = document.languageId;
    const languageConfig = LANGUAGE_CONFIGS[languageId];
    
    if (!languageConfig) {
      return [];
    }

    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substring(0, position.character);
    
    return this.generateCompletionItems(languageConfig, linePrefix);
  }

  private generateCompletionItems(
    languageConfig: LanguageConfig,
    linePrefix: string
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const config = vscode.workspace.getConfiguration("commentChameleon");
    const globalEmojiSetting = config.get<boolean>("useEmojis", true);

    for (const tag of this.allTags) {
      const tagName = this.normalizeTagName(tag.tag);
      if (!tagName) continue;

      const useEmoji = tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;
      const emojiString = useEmoji && tag.emoji ? ` ${tag.emoji}` : '';

      // Generate context-aware completions based on current line prefix
      items.push(...this.createTagCompletions(tag, tagName, emojiString, languageConfig, linePrefix));
    }

    return items;
  }

  private createTagCompletions(
    tag: CustomTag,
    tagName: string,
    emojiString: string,
    languageConfig: LanguageConfig,
    linePrefix: string
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const trimmedPrefix = linePrefix.trim();

    // Determine what types of comments this language supports
    const hasSingleLine = !!languageConfig.singleLineComment;
    const hasMultiLine = !!(languageConfig.multiLineStart && languageConfig.multiLineEnd);

    // Languages with only one comment type (HTML/XML/SVG) - show simple completion
    if (!hasSingleLine && hasMultiLine) {
      // HTML-style languages: only multi-line comments
      const multiStart = languageConfig.multiLineStart!;
      const multiEnd = languageConfig.multiLineEnd!;

      // Simple tag completion
      if (!trimmedPrefix || !trimmedPrefix.includes(multiStart)) {
        const item = new vscode.CompletionItem(tagName, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${multiStart} ${tag.tag}${emojiString} $1 ${multiEnd}`);
        item.detail = `${tag.tag} Comment`;
        item.documentation = new vscode.MarkdownString(`Insert \`${multiStart} ${tag.tag}${emojiString} ${multiEnd}\` comment`);
        item.sortText = `0_${tagName}`;
        items.push(item);
      }

      // Comment-aware completion
      if (trimmedPrefix.endsWith(multiStart) || trimmedPrefix.endsWith(multiStart + ' ')) {
        const item = new vscode.CompletionItem(tagName, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${tag.tag}${emojiString} $1 ${multiEnd}`);
        item.detail = `${tag.tag} Comment (continuation)`;
        item.documentation = new vscode.MarkdownString(`Continue with \`${tag.tag}${emojiString}\``);
        item.sortText = `1_${tagName}`;
        items.push(item);
      }
      
      return items;
    }

    // Languages with only single-line comments (rare case)
    if (hasSingleLine && !hasMultiLine) {
      const singleCommentPrefix = languageConfig.singleLineComment!;
      
      // Simple tag completion
      if (!trimmedPrefix || !trimmedPrefix.includes(singleCommentPrefix)) {
        const item = new vscode.CompletionItem(tagName, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${singleCommentPrefix} ${tag.tag}${emojiString} $1`);
        item.detail = `${tag.tag} Comment`;
        item.documentation = new vscode.MarkdownString(`Insert \`${singleCommentPrefix} ${tag.tag}${emojiString}\` comment`);
        item.sortText = `0_${tagName}`;
        items.push(item);
      }

      // Comment-aware completion
      if (trimmedPrefix.endsWith(singleCommentPrefix) || trimmedPrefix.endsWith(singleCommentPrefix + ' ')) {
        const item = new vscode.CompletionItem(tagName, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${tag.tag}${emojiString} $1`);
        item.detail = `${tag.tag} Comment (continuation)`;
        item.documentation = new vscode.MarkdownString(`Continue with \`${tag.tag}${emojiString}\``);
        item.sortText = `1_${tagName}`;
        items.push(item);
      }
      
      return items;
    }

    // Languages with both single-line and multi-line comments (C-style) - show explicit variants
    if (hasSingleLine && hasMultiLine) {
      const singleCommentPrefix = languageConfig.singleLineComment!;
      const multiStart = languageConfig.multiLineStart!;
      const multiEnd = languageConfig.multiLineEnd!;

      // Single-line completion with -s suffix
      if (!trimmedPrefix || !trimmedPrefix.includes(singleCommentPrefix)) {
        const item = new vscode.CompletionItem(`${tagName}-s`, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${singleCommentPrefix} ${tag.tag}${emojiString} $1`);
        item.detail = `${tag.tag} Comment (Single Line)`;
        item.documentation = new vscode.MarkdownString(`Insert \`${singleCommentPrefix} ${tag.tag}${emojiString}\` comment`);
        item.sortText = `0_${tagName}_single`;
        items.push(item);
      }

      // Multi-line completion with -m suffix
      if (!trimmedPrefix || !trimmedPrefix.includes(multiStart)) {
        const item = new vscode.CompletionItem(`${tagName}-m`, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${multiStart} ${tag.tag}${emojiString} $1 ${multiEnd}`);
        item.detail = `${tag.tag} Comment (Multi-line)`;
        item.documentation = new vscode.MarkdownString(`Insert \`${multiStart} ${tag.tag}${emojiString} ${multiEnd}\` comment`);
        item.sortText = `0_${tagName}_multi`;
        items.push(item);
      }

      // Comment-aware completions
      if (trimmedPrefix.endsWith(singleCommentPrefix) || trimmedPrefix.endsWith(singleCommentPrefix + ' ')) {
        const item = new vscode.CompletionItem(tagName, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${tag.tag}${emojiString} $1`);
        item.detail = `${tag.tag} Comment (single-line continuation)`;
        item.documentation = new vscode.MarkdownString(`Continue with \`${tag.tag}${emojiString}\``);
        item.sortText = `1_${tagName}_single_cont`;
        items.push(item);
      }

      if (trimmedPrefix.endsWith(multiStart) || trimmedPrefix.endsWith(multiStart + ' ')) {
        const item = new vscode.CompletionItem(tagName, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${tag.tag}${emojiString} $1 ${multiEnd}`);
        item.detail = `${tag.tag} Comment (multi-line continuation)`;
        item.documentation = new vscode.MarkdownString(`Continue with \`${tag.tag}${emojiString}\``);
        item.sortText = `1_${tagName}_multi_cont`;
        items.push(item);
      }
    }

    return items;
  }

  private normalizeTagName(tag: string): string {
    return tag.replace(":", "").toLowerCase().trim().replace(/\s+/g, "");
  }
}

// SECTION: 📑 Provider Registration and Management
let snippetProvider: CommentSnippetProvider | undefined;
let disposables: vscode.Disposable[] = [];

/**
 * WHAT_THIS_DO: 🤔 Registers intelligent completion providers for all supported languages
 * WHY: ❓ Provides dynamic, context-aware snippet suggestions without file management
 * PERFORMANCE: ⏱️ Uses VS Code's native completion API for optimal performance
 */
export function updateCustomTagSnippets(context: vscode.ExtensionContext): void {
  // Dispose existing providers
  disposeProviders();

  const allTags = getMergedTags();
  
  if (allTags.length === 0) {
    console.log("No tags defined, snippet providers disabled.");
    return;
  }

  console.log(`Registering intelligent completion providers for ${allTags.length} tags (predefined + custom).`);

  // Create and register new provider
  snippetProvider = new CommentSnippetProvider();
  
  // Register for all supported languages
  const supportedLanguages = Object.keys(LANGUAGE_CONFIGS);
  
  for (const language of supportedLanguages) {
    const disposable = vscode.languages.registerCompletionItemProvider(
      language,
      snippetProvider,
      ...getTriggerCharacters(language)
    );
    
    disposables.push(disposable);
    context.subscriptions.push(disposable);
  }

  console.log(`Completion providers registered for languages: ${supportedLanguages.join(', ')}`);
}

/**
 * WHAT_THIS_DO: 🤔 Determines appropriate trigger characters for each language
 * WHY: ❓ Optimizes completion triggering based on comment syntax
 */
function getTriggerCharacters(language: string): string[] {
  const config = LANGUAGE_CONFIGS[language];
  const triggers: string[] = [];

  if (config.singleLineComment) {
    // Trigger on comment start characters
    triggers.push(...config.singleLineComment.split(''));
  }

  if (config.multiLineStart) {
    // Trigger on multi-line comment start characters
    triggers.push(...config.multiLineStart.split(''));
  }

  // Always trigger on space and common tag characters
  triggers.push(' ', ':', '_', '-');

  return [...new Set(triggers)]; // Remove duplicates
}

/**
 * WHAT_THIS_DO: 🤔 Disposes all registered completion providers
 * WHY: ❓ Prevents memory leaks and ensures clean updates
 */
function disposeProviders(): void {
  disposables.forEach(d => d.dispose());
  disposables = [];
  snippetProvider = undefined;
}

/**
 * WHAT_THIS_DO: 🤔 Updates existing providers with new tag configuration
 * WHY: ❓ Provides real-time updates without VS Code restart
 */
export function refreshSnippetProviders(): void {
  if (snippetProvider) {
    snippetProvider.refreshTags();
    console.log("Snippet providers refreshed with updated tag configuration.");
  }
}

/**
 * WHAT_THIS_DO: 🤔 Cleanup function for extension deactivation
 * WHY: ❓ Ensures proper resource disposal
 */
export function disposeSnippetProviders(): void {
  disposeProviders();
  console.log("Snippet providers disposed.");
}
