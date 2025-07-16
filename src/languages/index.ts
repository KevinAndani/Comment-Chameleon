// SECTION: 📑 Language Support Utilities
// EXPLANATION: 💬 Functions for handling different programming language comment syntaxes
// WHY: ❓ Centralizes language-specific logic for better maintainability

import { getUserDefinedLanguages } from "../config";

/**
 * WHAT_THIS_DO: 🤔 Determines single-line comment prefix for a given language
 * WHY: ❓ Enables language-specific comment tag insertion
 * CONTEXT: 🌐 Supports both built-in and user-defined languages
 * @param languageId - VS Code language identifier
 * @returns Comment prefix string (e.g., "//", "#", "<!--")
 */
export function getCommentPrefix(languageId: string): string {
  // PERFORMANCE: ⏱️ Check user-defined languages first for customization priority
  const userLanguages = getUserDefinedLanguages();
  const userLanguage = userLanguages.find(
    (lang) => lang.languageName.toLowerCase() === languageId.toLowerCase()
  );
  
  if (userLanguage) {
    return userLanguage.singleLinePrefix;
  }

  // CONTEXT: 🌐 Built-in language comment prefix mappings
  const commentPrefixes: Record<string, string> = {
    python: "#",      // Python uses hash for comments
    javascript: "//", // JavaScript uses double slash
    typescript: "//", // TypeScript uses double slash
    c: "//",          // C uses double slash (C99 and later)
    cpp: "//",        // C++ uses double slash
    csharp: "//",     // C# uses double slash
    java: "//",       // Java uses double slash
    html: "<!--",     // HTML uses opening tag
    xml: "<!--",      // XML uses opening tag
    svg: "<!--",      // SVG uses opening tag
  };
  
  // SECURITY: 🔒 Default fallback to prevent undefined behavior
  return commentPrefixes[languageId] || "//";
}

/**
 * WHAT_THIS_DO: 🤔 Determines closing suffix for multi-line comments
 * WHY: ❓ Required for languages like HTML/XML that need closing tags
 * CONTEXT: 🌐 Most languages don't require suffixes for single-line comments
 * @param languageId - VS Code language identifier
 * @returns Comment suffix string (e.g., "-->") or empty string
 */
export function getCommentSuffix(languageId: string): string {
  // PERFORMANCE: ⏱️ Check user-defined languages first
  const userLanguages = getUserDefinedLanguages();
  const userLanguage = userLanguages.find(
    (lang) => lang.languageName.toLowerCase() === languageId.toLowerCase()
  );
  
  if (userLanguage) {
    return userLanguage.multiLineSuffix;
  }

  // CONTEXT: 🌐 Languages requiring closing comment tags
  const commentSuffixes: Record<string, string> = {
    html: "-->", // HTML requires closing comment tag
    xml: "-->",  // XML requires closing comment tag
    svg: "-->",  // SVG requires closing comment tag
  };
  
  // NOTE: 📝 Most programming languages don't need comment suffixes
  return commentSuffixes[languageId] || "";
}

// CONTEXT: 🌐 Common single-line comment prefixes for precise pattern matching
export const SINGLE_LINE_COMMENT_PREFIXES = ["//", "#", "--"];

// SECTION: 📑 Supported languages for completion provider
export const SUPPORTED_LANGUAGES = [
  "javascript", "typescript", "python", "html", "c", 
  "cpp", "csharp", "java", "xml", "svg"
];
