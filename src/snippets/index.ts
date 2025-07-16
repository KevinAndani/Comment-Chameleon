// SECTION: 📑 Snippet Generation and Management
// EXPLANATION: 💬 Functions for generating and managing VS Code snippets for comment tags
// WHY: ❓ Provides dynamic autocomplete functionality for user-defined tags

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { CustomTag, Snippet } from "../types";
import { getCustomTagsFromConfig, PREDEFINED_COMMENT_TAGS, shouldUseEmoji } from "../config";

/**
 * WHAT_THIS_DO: 🤔 Generates snippet body with consistent emoji formatting
 * WHY: ❓ Provides standardized snippet generation across different contexts
 * CONTEXT: 🌐 Used by snippet generators for various programming languages
 * @param tag - CustomTag object with styling and emoji properties
 * @param commentPrefix - Language-specific comment start syntax
 * @param commentSuffix - Language-specific comment end syntax (optional)
 * @returns Array containing snippet body string with proper formatting
 */
function generateSnippetBodyWithEmoji(
  tag: CustomTag,
  commentPrefix: string,
  commentSuffix: string = ""
): string[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  // WHAT_THIS_DO: 🤔 Determine emoji usage based on tag and global settings
  const useEmoji = tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

  // WHAT_THIS_DO: 🤔 Format emoji string with proper spacing
  let emojiString = "";
  if (useEmoji && tag.emoji) {
    emojiString = ` ${tag.emoji}`;
  }

  // CONTEXT: 🌐 $1 is VS Code snippet placeholder for cursor position
  return [`${commentPrefix}${tag.tag}${emojiString} $1${commentSuffix}`];
}

/**
 * WHAT_THIS_DO: 🤔 Generates snippets for C-style languages (JavaScript, TypeScript, C++, etc.)
 * WHY: ❓ Provides autocomplete functionality for // and /* comment styles
 * CONTEXT: 🌐 Used by languages that support both single-line and multi-line comments
 * @param tags - Array of custom tags to generate snippets for
 * @param type - Whether to generate single-line or multi-line comment snippets
 * @returns Record of snippet names to snippet definitions
 */
function generateGeneralSnippets(
  tags: CustomTag[],
  type?: "single-line" | "multi-line"
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  // WHAT_THIS_DO: 🤔 If no type specified, generate both single-line and multi-line
  if (!type) {
    const singleLineSnippets = generateGeneralSnippets(tags, "single-line");
    const multiLineSnippets = generateGeneralSnippets(tags, "multi-line");
    return { ...singleLineSnippets, ...multiLineSnippets };
  }

  tags.forEach((tag) => {
    // WHAT_THIS_DO: 🤔 Create clean tag name for snippet identification
    const tagName = tag.tag
      .replace(":", "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");
    
    // SECURITY: 🔒 Skip empty tag names to prevent invalid snippets
    if (!tagName) return;

    // WHAT_THIS_DO: 🤔 Create human-readable snippet name
    const friendlyName = `${tagName.charAt(0).toUpperCase() + tagName.slice(1)} Comment`;

    // WHAT_THIS_DO: 🤔 Determine emoji usage based on tag and global settings
    const useEmoji = tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

    // WHAT_THIS_DO: 🤔 Build emoji string if enabled
    let emojiString = "";
    if (useEmoji && tag.emoji) {
      emojiString = ` ${tag.emoji}`;
    }

    // SECTION: 📑 Snippet Generation by Comment Type
    if (type === "single-line") {
      snippets[`${tagName}-single`] = {
        prefix: tagName,
        body: [`// ${tag.tag}${emojiString} $1`],
        description: `${friendlyName} (Single Line)`
      };
    } else if (type === "multi-line") {
      snippets[`${tagName}-multi`] = {
        prefix: `${tagName}m`,
        body: [`/* ${tag.tag}${emojiString} $1 */`],
        description: `${friendlyName} (Multi Line)`
      };
    }
  });

  return snippets;
}

/**
 * WHAT_THIS_DO: 🤔 Generates snippets for Python hash-style comments
 * WHY: ❓ Provides autocomplete functionality for Python comment syntax
 * CONTEXT: 🌐 Python uses hash symbol for single-line comments
 * @param tags - Array of custom tags to generate snippets for
 * @returns Record of snippet names to snippet definitions
 */
function generatePythonSnippets(
  tags: CustomTag[]
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  tags.forEach((tag) => {
    // WHAT_THIS_DO: 🤔 Create clean tag name for snippet identification
    const tagName = tag.tag
      .replace(":", "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");
    
    // SECURITY: 🔒 Skip empty tag names to prevent invalid snippets
    if (!tagName) return;

    // WHAT_THIS_DO: 🤔 Determine emoji usage based on tag and global settings
    const useEmoji = tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

    // WHAT_THIS_DO: 🤔 Build emoji string if enabled
    let emojiString = "";
    if (useEmoji && tag.emoji) {
      emojiString = ` ${tag.emoji}`;
    }

    snippets[`${tagName}-python`] = {
      prefix: tagName,
      body: [`# ${tag.tag}${emojiString} $1`],
      description: `${tag.tag} Comment (Python Style)`
    };
  });

  return snippets;
}

/**
 * WHAT_THIS_DO: 🤔 Generates snippets for HTML/XML/SVG comment syntax
 * WHY: ❓ Provides autocomplete functionality for markup language comments
 * CONTEXT: 🌐 HTML, XML, and SVG use opening and closing comment tags
 * @param tags - Array of custom tags to generate snippets for
 * @returns Record of snippet names to snippet definitions
 */
function generateHtmlSnippets(
  tags: CustomTag[]
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  tags.forEach((tag) => {
    // WHAT_THIS_DO: 🤔 Create clean tag name for snippet identification
    const tagName = tag.tag
      .replace(":", "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");
    
    // SECURITY: 🔒 Skip empty tag names to prevent invalid snippets
    if (!tagName) return;

    // WHAT_THIS_DO: 🤔 Determine emoji usage based on tag and global settings
    const useEmoji = tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

    // WHAT_THIS_DO: 🤔 Build emoji string if enabled
    let emojiString = "";
    if (useEmoji && tag.emoji) {
      emojiString = ` ${tag.emoji}`;
    }

    snippets[`${tagName}-html`] = {
      prefix: tagName,
      body: [`<!-- ${tag.tag}${emojiString} $1 -->`],
      description: `${tag.tag} Comment (HTML Style)`
    };
  });

  return snippets;
}

/**
 * WHAT_THIS_DO: 🤔 Writes snippet objects to a file in JSON format
 * WHY: ❓ Creates VS Code compatible snippet files
 * @param context - VS Code extension context for file system access
 * @param relativePath - Relative path within snippets directory
 * @param snippets - Snippet objects to write
 */
function writeSnippetsFile(
  context: vscode.ExtensionContext,
  relativePath: string,
  snippets: Record<string, Snippet>
): void {
  const fullPath = path.join(context.extensionPath, "snippets", relativePath);
  
  // WHAT_THIS_DO: 🤔 Ensure directory exists before writing
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // WHAT_THIS_DO: 🤔 Write snippets as formatted JSON
  fs.writeFileSync(fullPath, JSON.stringify(snippets, null, 2));
}

/**
 * WHAT_THIS_DO: 🤔 Generates or clears snippet files based on custom tag configuration
 * WHY: ❓ Provides dynamic autocomplete functionality for user-defined tags
 * PERFORMANCE: ⏱️ Only processes user-defined tags to avoid snippet conflicts
 * @param context - VS Code extension context for file system access
 */
export function updateCustomTagSnippets(context: vscode.ExtensionContext): void {
  // PERFORMANCE: ⏱️ Fetch only custom tags to avoid predefined tag conflicts
  const customTags = getCustomTagsFromConfig();

  if (customTags.length === 0) {
    // INFO: ℹ️ Clear snippet files when no custom tags are defined
    console.log("No user-defined custom tags found, clearing custom snippet files.");
    clearSnippetFiles(context);
    return;
  }

  // DEBUG: 🐞 Log snippet generation for development monitoring
  console.log(`Generating custom snippets for ${customTags.length} user-defined tags.`);

  // SECTION: 📑 Language-Specific Snippet Generator Registry
  // EXPLANATION: 💬 Maps programming languages to their specific snippet generators
  const languageSnippetGenerators: Record<
    string, 
    (tags: CustomTag[], type?: "single-line" | "multi-line") => Record<string, Snippet>
  > = {
    javascript: generateGeneralSnippets,  // C-style comments
    typescript: generateGeneralSnippets,  // C-style comments
    c: generateGeneralSnippets,           // C-style comments
    cpp: generateGeneralSnippets,         // C-style comments
    csharp: generateGeneralSnippets,      // C-style comments
    java: generateGeneralSnippets,        // C-style comments
    python: generatePythonSnippets,       // Hash-style comments
    html: generateHtmlSnippets,           // HTML-style comments
    xml: generateHtmlSnippets,            // XML-style comments
    svg: generateHtmlSnippets,            // SVG-style comments
  };

  // WHAT_THIS_DO: 🤔 Generate snippets for each supported language
  for (const [language, generator] of Object.entries(languageSnippetGenerators)) {
    const languageDir = path.join(context.extensionPath, "snippets", language);

    // WHAT_THIS_DO: 🤔 Ensure language-specific directory exists for snippet files
    if (!fs.existsSync(languageDir)) {
      fs.mkdirSync(languageDir, { recursive: true });
    }

    if (language === "python" || language === "html" || language === "xml" || language === "svg") {
      // WHAT_THIS_DO: 🤔 Single comment style for these languages
      const customSnippets = generator(customTags);
      writeSnippetsFile(
        context, 
        path.join(language, `${language}-custom.code-snippets`), 
        customSnippets
      );
    } else {
      // SECTION: 📑 Generate Custom Tag Snippets for C-style languages
      // EXPLANATION: 💬 Create snippets for user-defined comment tags
      
      // WHAT_THIS_DO: 🤔 Generate single-line snippets for custom tags
      const singleLineCustomSnippets = generator(customTags, "single-line");
      writeSnippetsFile(
        context, 
        path.join(language, `single-line-${language}-custom.code-snippets`), 
        singleLineCustomSnippets
      );

      // WHAT_THIS_DO: 🤔 Generate multi-line snippets for custom tags
      const multiLineCustomSnippets = generator(customTags, "multi-line");
      writeSnippetsFile(
        context, 
        path.join(language, `multi-line-${language}-custom.code-snippets`), 
        multiLineCustomSnippets
      );
    }
  }
}

/**
 * WHAT_THIS_DO: 🤔 Removes all custom snippet files from the file system
 * WHY: ❓ Cleanup function when no custom tags are defined
 * PERFORMANCE: ⏱️ Recursive deletion for complete cleanup
 * @param context - VS Code extension context for file system access
 */
function clearSnippetFiles(context: vscode.ExtensionContext): void {
  const snippetsDir = path.join(context.extensionPath, "snippets");

  // CONTEXT: 🌐 List of all languages with snippet support
  const supportedLanguages = [
    "javascript", "typescript", "c", "cpp", "csharp", 
    "java", "python", "html", "xml", "svg",
  ];

  // WHAT_THIS_DO: 🤔 Remove language-specific directories and all contained files
  for (const language of supportedLanguages) {
    const languageDir = path.join(snippetsDir, language);

    // SECURITY: 🔒 Check existence before attempting deletion
    if (fs.existsSync(languageDir)) {
      fs.rmSync(languageDir, { recursive: true, force: true });
    }
  }

  // DEBUG: 🐞 Log cleanup completion for development verification
  console.log("Cleared custom snippet files.");
}
