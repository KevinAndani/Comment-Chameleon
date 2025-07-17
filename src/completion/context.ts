// SECTION: 📑 Comment Context Analysis System
// EXPLANATION: 💬 Advanced context detection for intelligent comment tag suggestions
// WHY: ❓ Provides smart completion by analyzing comment context

import { CommentContext } from "../types";
import { getCommentPrefix } from "../languages";
import { escapeRegex } from "../utils";

/**
 * WHAT_THIS_DO: 🤔 Analyzes text context to determine if comment tag suggestions are appropriate
 * WHY: ❓ Prevents intrusive suggestions in non-comment contexts
 * PERFORMANCE: ⏱️ Uses regex patterns for efficient context detection
 * @param textBeforeCursor - Text from line start to cursor position
 * @param languageId - Current file's language identifier
 * @returns CommentContext object with analysis results
 */
export function analyzeCommentContext(textBeforeCursor: string, languageId: string): CommentContext {
  const commentPrefix = getCommentPrefix(languageId);
  
  // SECTION: 📑 Regular Expression Pattern Definitions
  // EXPLANATION: 💬 Patterns to match various comment scenarios and contexts
  const patterns = {
    // WHAT_THIS_DO: 🤔 Matches single-line comments with optional partial tags
    // CONTEXT: 🌐 Examples: "// ", "# NOTE", "// TODO"
    singleLine: new RegExp(`(${escapeRegex(commentPrefix)})\\s*([A-Z_]*)$`, 'i'),
    
    // WHAT_THIS_DO: 🤔 Matches multi-line comment starts
    // CONTEXT: 🌐 Examples: "/* ", "<!-- FIXME"
    multiLineStart: new RegExp(`(/\\*|<!--)\\s*([A-Z_]*)$`, 'i'),
    
    // WHAT_THIS_DO: 🤔 Matches within existing comments - more precise pattern
    // CONTEXT: 🌐 Only triggers after comment prefix followed by space and then uppercase words
    withinComment: new RegExp(`(${escapeRegex(commentPrefix)}|/\\*|<!--)\\s+[^A-Z]*?\\s+([A-Z_]{2,})$`, 'i'),
    
    // WHAT_THIS_DO: 🤔 Matches after code statements for inline comments - more specific
    // CONTEXT: 🌐 Only triggers with meaningful uppercase sequences
    afterCode: new RegExp(`[;})]\\s+([A-Z_]{2,})$`, 'i'),
  };

  // SECTION: 📑 Context Analysis Logic
  // PERFORMANCE: ⏱️ Check patterns in order of specificity

  // WHAT_THIS_DO: 🤔 Check for single-line comment pattern
  const singleLineMatch = textBeforeCursor.match(patterns.singleLine);
  if (singleLineMatch) {
    return {
      shouldSuggest: true,
      isNewComment: false,
      partialTag: singleLineMatch[2] || "",
      commentPrefix: commentPrefix
    };
  }

  // WHAT_THIS_DO: 🤔 Check for multi-line comment start
  const multiLineMatch = textBeforeCursor.match(patterns.multiLineStart);
  if (multiLineMatch) {
    return {
      shouldSuggest: true,
      isNewComment: false,
      partialTag: multiLineMatch[2] || "",
      commentPrefix: multiLineMatch[1]
    };
  }

  // WHAT_THIS_DO: 🤔 Check if we're within an existing comment but only suggest at specific positions
  const withinCommentMatch = textBeforeCursor.match(patterns.withinComment);
  if (withinCommentMatch) {
    const partialTag = withinCommentMatch[2] || "";
    // OPTIMIZE: 🚀 Only suggest if we have a partial tag that looks like a comment tag
    // This prevents suggestions after every word in a comment sentence
    if (partialTag.length >= 2 && /^[A-Z_]+$/i.test(partialTag)) {
      return {
        shouldSuggest: true,
        isNewComment: false,
        partialTag: partialTag,
        commentPrefix: withinCommentMatch[1]
      };
    }
  }

  // WHAT_THIS_DO: 🤔 Check for inline comment opportunity after code
  const afterCodeMatch = textBeforeCursor.match(patterns.afterCode);
  if (afterCodeMatch) {
    const partialTag = afterCodeMatch[1] || "";
    // OPTIMIZE: 🚀 Only suggest if we have a meaningful partial tag
    if (partialTag.length >= 2 && /^[A-Z_]+$/i.test(partialTag)) {
      return {
        shouldSuggest: true,
        isNewComment: true,
        partialTag: partialTag,
        commentPrefix: commentPrefix
      };
    }
  }

  // WHAT_THIS_DO: 🤔 Check for partial tag-like text at end of line
  const endOfLinePattern = /\s+([A-Z_]+)$/i;
  const endOfLineMatch = textBeforeCursor.match(endOfLinePattern);
  if (endOfLineMatch && endOfLineMatch[1].length >= 3) { // Increased minimum length
    return {
      shouldSuggest: true,
      isNewComment: true,
      partialTag: endOfLineMatch[1],
      commentPrefix: commentPrefix
    };
  }

  // OPTIMIZE: 🚀 No valid comment context found
  return {
    shouldSuggest: false,
    isNewComment: false,
    partialTag: ""
  };
}
