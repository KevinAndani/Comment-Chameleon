// SECTION: 📑 Import Dependencies and Core Modules
import * as vscode from "vscode";
import { TagEditorPanel } from "./tagEditor";
import { LanguageEditorPanel } from "./tagEditor"; // FIXME: 🔧 Consider separate file for language editor
import * as fs from "fs";
import * as path from "path";

// SECTION: 📑 Predefined Comment Tag Definitions
// EXPLANATION: 💬 This array contains all built-in comment tags with their styling properties
// INFO: ℹ️ These tags provide default highlighting for common comment patterns
const PREDEFINED_COMMENT_TAGS: CustomTag[] = [
  {
    // NOTE: 📝 General comment style for basic highlighting
    tag: "//",
    color: "#6272a4", // PERFORMANCE: ⏱️ Dracula theme comment color for consistency
    strikethrough: false,
    underline: false,
    backgroundColor: "transparent",
    // WARNING: Consider if this broad tag is needed for specific highlighting
  },
  {
    // EXPLANATION: 💬 Tag for explaining complex code sections
    tag: "EXPLANATION:",
    color: "#ff70b3",
    strikethrough: false,
    underline: false,
    backgroundColor: "transparent",
    emoji: "💬",
  },
  {
    // TODO: 📋 Standard task tracking tag
    tag: "TODO:",
    color: "#ffc66d",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📋",
  },
  {
    // FIXME: 🔧 Critical issues requiring immediate attention
    tag: "FIXME:",
    color: "#ff6e6e",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🔧",
  },
  {
    // BUG: 🐛 Known issues with background highlighting for visibility
    tag: "BUG:",
    color: "#f8f8f2",
    strikethrough: false,
    backgroundColor: "#bb80ff",
    emoji: "🐛",
  },
  {
    // HACK: ⚡ Temporary workarounds that need proper solutions
    tag: "HACK:",
    color: "#ffffa5",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "⚡",
  },
  {
    // NOTE: 📝 General informational comments
    tag: "NOTE:",
    color: "#94f0ff",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📝",
  },
  {
    // INFO: ℹ️ Informational tags for documentation
    tag: "INFO:",
    color: "#c798e6",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "ℹ️",
  },
  {
    // IDEA: 💡 Creative suggestions and improvements
    tag: "IDEA:",
    color: "#80ffce",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "💡",
  },
  {
    // DEBUG: 🐞 Debugging information and temporary code
    tag: "DEBUG:",
    color: "#ff2975",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🐞",
  },
  {
    // WHY: ❓ Explanations for design decisions
    tag: "WHY:",
    color: "#ff9580",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "❓",
  },
  {
    // WHAT_THIS_DO: 🤔 Code explanation for complex logic
    tag: "WHAT_THIS_DO:",
    color: "#FBBF24",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🤔",
  },
  {
    // CONTEXT: 🌐 Background information and context
    tag: "CONTEXT:",
    color: "#d8ff80",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🌐",
  },
  {
    // CRITICAL: ⚠️ High-priority issues requiring immediate attention
    tag: "CRITICAL:",
    color: "#FFFFFF",
    strikethrough: false,
    backgroundColor: "#9F1239",
    bold: true,
    emoji: "⚠️",
  },
  {
    // REVIEW: 👁️ Code sections requiring peer review
    tag: "REVIEW:",
    color: "#A5B4FC",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "👁️",
  },
  {
    // OPTIMIZE: 🚀 Performance optimization opportunities
    tag: "OPTIMIZE:",
    color: "#4ADE80",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🚀",
  },
  {
    // SECTION: 📑 Code organization and section markers
    tag: "SECTION:",
    color: "#f1a18e",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📑",
  },
  {
    // NEXT STEP: ➡️ Sequential development tasks
    tag: "NEXT STEP:",
    color: "#ba6645",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "➡️",
  },
  {
    // SECURITY: 🔒 Security-related considerations
    tag: "SECURITY:",
    color: "#cff028",
    strikethrough: false,
    backgroundColor: "#44475a",
    emoji: "🔒",
  },
  {
    // PERFORMANCE: ⏱️ Performance-related comments
    tag: "PERFORMANCE:",
    color: "#d7ffad",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "⏱️",
  },
  {
    // DEPRECATED: ⛔ Obsolete code marked for removal
    tag: "DEPRECATED:",
    color: "#8b8098",
    strikethrough: true,
    backgroundColor: "#44475a",
    emoji: "⛔",
  },
  {
    // API: 🔌 API-related documentation and endpoints
    tag: "API:",
    color: "#c798e6",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🔌",
  },
];

// SECTION: 📑 Global State Management
// EXPLANATION: 💬 These variables manage the extension's runtime state
// INFO: ℹ️ activeDecorationTypes stores reusable decoration instances for performance
let activeDecorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

// NOTE: 📝 Timeout for debouncing decoration updates to improve performance
let decorationTimeout: NodeJS.Timeout | undefined = undefined;

// SECTION: 📑 Configuration Helper Functions
// EXPLANATION: 💬 Functions to safely retrieve and parse user configuration

/**
 * WHAT_THIS_DO: 🤔 Retrieves only user-defined custom tags from VS Code configuration
 * WHY: ❓ Separates user tags from predefined tags for proper merging logic
 * @returns Array of user-defined custom tags
 */
function getCustomTagsFromConfig(): CustomTag[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const rawCustomTags = config.get<CustomTag[]>("customTags");
  // SECURITY: 🔒 Validate array type to prevent runtime errors
  return Array.isArray(rawCustomTags) ? rawCustomTags : [];
}

// SECTION: 📑 User-Defined Language Support
// EXPLANATION: 💬 Interface and functions for custom language definitions

/**
 * WHAT_THIS_DO: 🤔 Defines structure for user-defined programming languages
 * INFO: ℹ️ Allows users to add comment syntax for unsupported languages
 */
export interface UserDefinedLanguage {
  languageName: string;      // CONTEXT: 🌐 Language identifier (e.g., "rust", "go")
  singleLinePrefix: string;  // CONTEXT: 🌐 Single-line comment syntax (e.g., "//", "#")
  multiLinePrefix: string;   // CONTEXT: 🌐 Multi-line comment start (e.g., "/*", "<!--")
  multiLineSuffix: string;   // CONTEXT: 🌐 Multi-line comment end (e.g., "*/", "-->")
}

/**
 * WHAT_THIS_DO: 🤔 Retrieves user-defined language configurations
 * WHY: ❓ Enables support for languages not built into the extension
 * @returns Array of user-defined languages
 */
export function getUserDefinedLanguages(): UserDefinedLanguage[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const languages = config.get<UserDefinedLanguage[]>("userDefinedLanguages");
  // SECURITY: 🔒 Type validation for configuration safety
  return Array.isArray(languages) ? languages : [];
}

// SECTION: 📑 Extension Activation Function
// EXPLANATION: 💬 Main entry point - initializes all extension features and event listeners

/**
 * WHAT_THIS_DO: 🤔 Activates the Comment Chameleon extension
 * WHY: ❓ Sets up commands, event listeners, and initial state
 * CONTEXT: 🌐 Called automatically by VS Code when extension loads
 * @param context - VS Code extension context for subscriptions and resources
 */
export function activate(context: vscode.ExtensionContext) {
  // DEBUG: 🐞 Log activation for troubleshooting
  console.log("Comment Chameleon is now active");
  
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

  // SECTION: 📑 Initial Setup and State Initialization
  // PERFORMANCE: ⏱️ Apply decorations to active editor immediately for responsive UX
  if (vscode.window.activeTextEditor) {
    triggerUpdateDecorations(vscode.window.activeTextEditor);
  }

  // NEXT STEP: ➡️ Generate code snippets for enhanced autocomplete
  updateCustomTagSnippets(context);

  // SECTION: 📑 Command Registration
  // EXPLANATION: 💬 Register all extension commands with VS Code command palette

  // API: 🔌 Command to manually refresh comment highlighting
  // WHAT_THIS_DO: 🤔 Allows users to force-refresh styles when issues occur
  const applyStylesCommand = vscode.commands.registerCommand(
    "comment-chameleon.applyStyles",
    () => {
      // PERFORMANCE: ⏱️ Clear old decorations to prevent memory leaks
      clearAllDecorations();
      
      // OPTIMIZE: 🚀 Force immediate update for responsive user feedback
      if (vscode.window.activeTextEditor) {
        triggerUpdateDecorations(vscode.window.activeTextEditor, true);
      }
      
      // NEXT STEP: ➡️ Regenerate snippets with latest configuration
      updateCustomTagSnippets(context);
      
      // INFO: ℹ️ Provide user feedback for successful operation
      vscode.window.showInformationMessage(
        "Comment Chameleon: Styles refreshed successfully!"
      );
    }
  );

  // API: 🔌 Command to open tag editor interface
  // WHAT_THIS_DO: 🤔 Provides GUI for managing custom comment tags
  const editTagsCommand = vscode.commands.registerCommand(
    "comment-chameleon.editTags",
    () => {
      TagEditorPanel.createOrShow(context.extensionUri);
    }
  );

  // API: 🔌 Command to open language editor interface
  // WHAT_THIS_DO: 🤔 Provides GUI for managing custom language definitions
  const editLanguagesCommand = vscode.commands.registerCommand(
    "comment-chameleon.editLanguages",
    () => {
      LanguageEditorPanel.createOrShow(context.extensionUri);
    }
  );

  // SECURITY: 🔒 Register commands with extension context for proper cleanup
  context.subscriptions.push(
    applyStylesCommand,
    editTagsCommand,
    editLanguagesCommand
  );

  // SECTION: 📑 Event Listener Registration
  // EXPLANATION: 💬 Set up reactive event handlers for real-time functionality

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
          clearAllDecorations();
          
          if (vscode.window.activeTextEditor) {
            triggerUpdateDecorations(vscode.window.activeTextEditor, true);
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
        triggerUpdateDecorations(editor);
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
        triggerUpdateDecorations(vscode.window.activeTextEditor);
      }
    })
  );

  // SECTION: 📑 Development and Debug Commands
  // DEBUG: 🐞 Command for verifying snippet file generation during development

  // API: 🔌 Development command to check snippet file status
  // WHAT_THIS_DO: 🤔 Provides debugging information about generated snippet files
  const checkSnippetsCommand = vscode.commands.registerCommand(
    "comment-chameleon.checkSnippets",
    () => {
      const snippetsDir = path.join(context.extensionPath, "snippets");
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
  );

  // SECURITY: 🔒 Register debug command with proper cleanup
  context.subscriptions.push(checkSnippetsCommand);

  // SECTION: 📑 Intelligent Auto-Completion Provider
  // EXPLANATION: 💬 Advanced completion system for comment tags with context awareness
  // PERFORMANCE: ⏱️ Supports multiple languages and comment contexts

  // API: 🔌 Register enhanced completion provider for comment tags
  // WHAT_THIS_DO: 🤔 Provides intelligent suggestions for comment tags based on context
  // WHY: ❓ Improves developer productivity with smart autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      // CONTEXT: 🌐 Supported languages for comment tag completion
      [
        "javascript", "typescript", "python", "html", "c", 
        "cpp", "csharp", "java", "xml", "svg"
      ],
      {
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
        ) {
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
        },
      },
      // CONTEXT: 🌐 Trigger characters for intelligent completion activation
      "//", // Single-line comments (JavaScript, C-family)
      "#",  // Python, shell scripts
      "<",  // HTML, XML comments
      "*",  // Multi-line C-style comments
      ":",  // After tag names
      " "   // After comment prefixes
    )
  );
}

// SECTION: 📑 Comment Syntax Helper Functions
// EXPLANATION: 💬 Functions to determine comment syntax for different programming languages

/**
 * WHAT_THIS_DO: 🤔 Determines single-line comment prefix for a given language
 * WHY: ❓ Enables language-specific comment tag insertion
 * CONTEXT: 🌐 Supports both built-in and user-defined languages
 * @param languageId - VS Code language identifier
 * @returns Comment prefix string (e.g., "//", "#", "<!--")
 */
function getCommentPrefix(languageId: string): string {
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
function getCommentSuffix(languageId: string): string {
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

// SECTION: 📑 Comment Context Analysis System
// EXPLANATION: 💬 Advanced context detection for intelligent comment tag suggestions

/**
 * WHAT_THIS_DO: 🤔 Interface defining comment context analysis results
 * WHY: ❓ Structured data for context-aware completion decisions
 * INFO: ℹ️ Used by completion provider to determine suggestion behavior
 */
interface CommentContext {
  shouldSuggest: boolean;  // CONTEXT: 🌐 Whether to show tag suggestions
  isNewComment: boolean;   // CONTEXT: 🌐 True if starting new comment, false if continuing
  partialTag: string;      // CONTEXT: 🌐 User's partial input for filtering
  commentPrefix?: string;  // CONTEXT: 🌐 Detected comment syntax for language
}

/**
 * WHAT_THIS_DO: 🤔 Analyzes text context to determine if comment tag suggestions are appropriate
 * WHY: ❓ Prevents intrusive suggestions in non-comment contexts
 * PERFORMANCE: ⏱️ Uses regex patterns for efficient context detection
 * @param textBeforeCursor - Text from line start to cursor position
 * @param languageId - Current file's language identifier
 * @returns CommentContext object with analysis results
 */
function analyzeCommentContext(textBeforeCursor: string, languageId: string): CommentContext {
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
    
    // WHAT_THIS_DO: 🤔 Matches within existing comments
    // CONTEXT: 🌐 Examples: "// Some text NOTE", "# Debug info TODO"
    withinComment: new RegExp(`(${escapeRegex(commentPrefix)}|/\\*|<!--)\\s+.*?\\s*([A-Z_]*)$`, 'i'),
    
    // WHAT_THIS_DO: 🤔 Matches after code statements for inline comments
    // CONTEXT: 🌐 Examples: "return value; TODO", "} FIXME"
    afterCode: new RegExp(`[;})]\\s*([A-Z_]*)$`, 'i'),
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

  // WHAT_THIS_DO: 🤔 Check if we're within an existing comment
  const withinCommentMatch = textBeforeCursor.match(patterns.withinComment);
  if (withinCommentMatch) {
    return {
      shouldSuggest: true,
      isNewComment: false,
      partialTag: withinCommentMatch[2] || "",
      commentPrefix: withinCommentMatch[1]
    };
  }

  // WHAT_THIS_DO: 🤔 Check for inline comment opportunity after code
  const afterCodeMatch = textBeforeCursor.match(patterns.afterCode);
  if (afterCodeMatch) {
    return {
      shouldSuggest: true,
      isNewComment: true,
      partialTag: afterCodeMatch[1] || "",
      commentPrefix: commentPrefix
    };
  }

  // WHAT_THIS_DO: 🤔 Check for partial tag-like text at end of line
  const endOfLinePattern = /\s+([A-Z_]+)$/i;
  const endOfLineMatch = textBeforeCursor.match(endOfLinePattern);
  if (endOfLineMatch && endOfLineMatch[1].length >= 2) {
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

/**
 * WHAT_THIS_DO: 🤔 Escapes special regex characters to prevent regex injection
 * WHY: ❓ Ensures safe regex construction with user-provided strings
 * SECURITY: 🔒 Prevents regex injection attacks from user input
 * @param str - String to escape for regex use
 * @returns Safely escaped string for regex patterns
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// SECTION: 📑 Emoji Configuration Helper Functions
// EXPLANATION: 💬 Functions to manage emoji display preferences for comment tags

/**
 * WHAT_THIS_DO: 🤔 Determines if emoji should be displayed for a specific tag
 * WHY: ❓ Respects both global and tag-specific emoji preferences
 * CONTEXT: 🌐 Supports granular control over emoji visibility
 * @param tag - CustomTag object with potential emoji configuration
 * @returns Boolean indicating whether emoji should be shown
 */
function shouldUseEmoji(tag: CustomTag): boolean {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);
  
  // WHAT_THIS_DO: 🤔 Priority: tag-specific setting > global setting
  // WHY: ❓ Allows users to enable/disable emojis per tag while maintaining global default
  const useEmoji = tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;
  
  // SECURITY: 🔒 Ensure both setting is enabled AND emoji exists
  return useEmoji && !!tag.emoji;
}

// SECTION: 📑 Decoration Update Management
// EXPLANATION: 💬 Performance-optimized decoration updating with debouncing

/**
 * WHAT_THIS_DO: 🤔 Triggers decoration updates with optional debouncing for performance
 * WHY: ❓ Prevents excessive decoration updates during rapid text changes
 * PERFORMANCE: ⏱️ Uses timeout-based debouncing to optimize rendering
 * @param editor - Text editor to update decorations for
 * @param immediate - Whether to skip debouncing and update immediately
 */
function triggerUpdateDecorations(
  editor: vscode.TextEditor,
  immediate: boolean = false
) {
  // OPTIMIZE: 🚀 Clear existing timeout to reset debounce timer
  if (decorationTimeout) {
    clearTimeout(decorationTimeout);
    decorationTimeout = undefined;
  }
  
  if (immediate) {
    // PERFORMANCE: ⏱️ Immediate update for user-initiated actions
    updateDecorationsForEditor(editor);
  } else {
    // PERFORMANCE: ⏱️ Debounced update for text changes (500ms delay)
    decorationTimeout = setTimeout(
      () => updateDecorationsForEditor(editor),
      500
    );
  }
}

// SECTION: 📑 Tag Management and Merging Logic
// EXPLANATION: 💬 Functions to handle predefined and custom tag integration

/**
 * WHAT_THIS_DO: 🤔 Merges predefined and custom tags with proper precedence handling
 * WHY: ❓ Allows users to override predefined tags while maintaining defaults
 * PERFORMANCE: ⏱️ Filters out predefined tags that are redefined by users
 * @returns Combined array of all active tags (predefined + custom)
 */
function getMergedTags(): CustomTag[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const rawCustomTags = config.get<CustomTag[]>("customTags");
  const customTags = getCustomTagsFromConfig();
  
  // WHAT_THIS_DO: 🤔 Filter predefined tags to avoid duplicates with custom tags
  // WHY: ❓ Custom tags should override predefined ones with same tag text
  const predefinedTagsFiltered = PREDEFINED_COMMENT_TAGS.filter(
    (predefined) => !customTags.some((custom) => custom.tag === predefined.tag)
  );
  
  // CONTEXT: 🌐 Custom tags take precedence over predefined tags
  return [...predefinedTagsFiltered, ...customTags];
}

// SECTION: 📑 VS Code Decoration Type Management
// EXPLANATION: 💬 Efficient creation and caching of text editor decoration types

/**
 * WHAT_THIS_DO: 🤔 Creates or retrieves cached decoration type for a comment tag
 * WHY: ❓ Reuses decoration types for performance and memory efficiency
 * PERFORMANCE: ⏱️ Uses JSON-based caching to avoid recreating identical decorations
 * @param tag - CustomTag object defining visual styling properties
 * @returns VS Code TextEditorDecorationType for applying to text ranges
 */
function getDecorationTypeForTag(
  tag: CustomTag
): vscode.TextEditorDecorationType {
  // PERFORMANCE: ⏱️ Create unique cache key from visual properties
  const decorationKey = JSON.stringify({
    color: tag.color,
    backgroundColor: tag.backgroundColor,
    strikethrough: tag.strikethrough,
    underline: tag.underline,
    bold: tag.bold,
    italic: tag.italic,
    // NOTE: 📝 Only include properties that affect visual appearance
  });

  // OPTIMIZE: 🚀 Return cached decoration type if available
  if (activeDecorationTypes.has(decorationKey)) {
    return activeDecorationTypes.get(decorationKey)!;
  }

  // SECTION: 📑 Text Decoration String Construction
  // WHAT_THIS_DO: 🤔 Build CSS-style text-decoration value
  let textDecoration = "";
  if (tag.strikethrough && tag.underline) {
    textDecoration = "underline line-through";
  } else if (tag.strikethrough) {
    textDecoration = "line-through";
  } else if (tag.underline) {
    textDecoration = "underline";
  }

  // SECTION: 📑 VS Code Decoration Options Configuration
  // EXPLANATION: 💬 Map tag properties to VS Code decoration render options
  const options: vscode.DecorationRenderOptions = {
    color: tag.color,
    backgroundColor: tag.backgroundColor,
    textDecoration: textDecoration || undefined, // PERFORMANCE: ⏱️ Use undefined for no decoration
    fontWeight: tag.bold ? "bold" : undefined,
    fontStyle: tag.italic ? "italic" : undefined,
    // rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed, // Default behavior
  };

  // ACCESSIBILITY: 🎯 Ensure theme compatibility with fallback colors
  if (!options.color && !options.backgroundColor) {
    // WHAT_THIS_DO: 🤔 Provide fallback color for better contrast
    options.color = new vscode.ThemeColor("editorCodeLens.foreground");
  }

  // WHAT_THIS_DO: 🤔 Create and cache new decoration type
  const decorationType = vscode.window.createTextEditorDecorationType(options);
  activeDecorationTypes.set(decorationKey, decorationType);
  
  return decorationType;
}

// SECTION: 📑 Snippet Generation Helper Functions
// EXPLANATION: 💬 Functions for creating VS Code snippets with emoji support

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

// SECTION: 📑 Decoration Cleanup and Management
// EXPLANATION: 💬 Functions for managing decoration lifecycle and memory cleanup

/**
 * WHAT_THIS_DO: 🤔 Clears all active decorations to prevent memory leaks
 * WHY: ❓ Essential for cleanup when configuration changes or extension deactivates
 * PERFORMANCE: ⏱️ Disposes decoration types and clears editor decorations
 */
function clearAllDecorations() {
  // MEMORY: 🧠 Dispose all cached decoration types to free resources
  activeDecorationTypes.forEach((type) => type.dispose());
  activeDecorationTypes.clear();
  
  // NOTE: 📝 Individual editor decorations are cleared by updateDecorationsForEditor
  // CONTEXT: 🌐 VS Code handles editor-specific decoration cleanup automatically
  vscode.window.visibleTextEditors.forEach((editor) => {
    // INFO: ℹ️ The updateDecorationsForEditor function handles specific decoration clearing
    // WHAT_THIS_DO: 🤔 This loop is for future enhancement possibilities
  });
}

// SECTION: 📑 Comment Pattern Definitions
// EXPLANATION: 💬 Configuration for detecting various comment syntaxes across languages

// CONTEXT: 🌐 Common single-line comment prefixes for precise pattern matching
const SINGLE_LINE_COMMENT_PREFIXES = ["//", "#", "--"];

/**
 * WHAT_THIS_DO: 🤔 Interface defining multi-line comment pattern structure
 * WHY: ❓ Standardizes detection of block comments across different languages
 * INFO: ℹ️ Used by decoration engine to find tags within multi-line comments
 */
interface MultiLineCommentPattern {
  name: string;                // CONTEXT: 🌐 Human-readable pattern identifier
  startDelimiterRegex: string; // CONTEXT: 🌐 Regex for comment start (e.g., /\/\*/)
  endDelimiterRegex: string;   // CONTEXT: 🌐 Regex for comment end (e.g., /\*\//)
  tagAtStart: true;            // INFO: ℹ️ Whether tag must appear immediately after start delimiter
}

// SECTION: 📑 Multi-Line Comment Pattern Registry
// EXPLANATION: 💬 Comprehensive patterns for various multi-line comment syntaxes
const MULTI_LINE_COMMENT_PATTERNS: MultiLineCommentPattern[] = [
  {
    // CONTEXT: 🌐 C/C++/Java/JavaScript style: /* TAG content */
    name: "c-style",
    startDelimiterRegex: "/\\*\\s*",
    endDelimiterRegex: "\\*\\/",
    tagAtStart: true,
  },
  {
    // CONTEXT: 🌐 HTML/XML/SVG style: <!-- TAG content -->
    name: "html-style",
    startDelimiterRegex: "<!--\\s*",
    endDelimiterRegex: "-->",
    tagAtStart: true,
  },
  {
    // CONTEXT: 🌐 Python triple-quote docstrings: """TAG content"""
    // NOTE: 📝 Simplified implementation - robust Python parsing is complex
    name: "python-triple-double-quotes",
    startDelimiterRegex: '"""\\s*',
    endDelimiterRegex: '"""',
    tagAtStart: true,
  },
  {
    // CONTEXT: 🌐 Python single-quote docstrings: '''TAG content'''
    name: "python-triple-single-quotes",
    startDelimiterRegex: "'''\\s*",
    endDelimiterRegex: "'''",
    tagAtStart: true,
  },
];

// SECTION: 📑 Core Decoration Engine
// EXPLANATION: 💬 Main function that analyzes text and applies comment tag highlighting

/**
 * WHAT_THIS_DO: 🤔 Analyzes document text and applies decorations to comment tags
 * WHY: ❓ Core functionality - provides visual highlighting for comment tags
 * PERFORMANCE: ⏱️ Optimized regex matching for both single and multi-line comments
 * @param editor - VS Code text editor to apply decorations to
 */
function updateDecorationsForEditor(editor: vscode.TextEditor) {
  // SECURITY: 🔒 Validate editor and document existence
  if (!editor || !editor.document) return;

  const allTags = getMergedTags();
  
  // OPTIMIZE: 🚀 Early return if no tags to process
  if (allTags.length === 0) {
    // WHAT_THIS_DO: 🤔 Clear existing decorations when no tags are configured
    activeDecorationTypes.forEach((decorationType) => {
      editor.setDecorations(decorationType, []);
    });
    return;
  }

  // PERFORMANCE: ⏱️ Get full document text once for all processing
  const text = editor.document.getText();
  
  // WHAT_THIS_DO: 🤔 Map to store decoration ranges for each decoration type
  const decorationsMap: Map<vscode.TextEditorDecorationType, vscode.Range[]> = new Map();

  // SECTION: 📑 Tag Processing Loop
  // EXPLANATION: 💬 Process each tag to find matching comments and build decoration ranges
  for (const tagDefinition of allTags) {
    const decorationType = getDecorationTypeForTag(tagDefinition);
    
    // PERFORMANCE: ⏱️ Initialize decoration map entry for clearing previous decorations
    if (!decorationsMap.has(decorationType)) {
      decorationsMap.set(decorationType, []);
    }
    
    const rangesForThisTag: vscode.Range[] = [];

    // SECURITY: 🔒 Escape tag text for safe regex usage
    const escapedTag = tagDefinition.tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // SECTION: 📑 Single-Line Comment Detection
    // EXPLANATION: 💬 Find tags in single-line comments (e.g., // TODO:, # NOTE:)
    
    // WHAT_THIS_DO: 🤔 Escape all single-line comment prefixes for regex safety
    const singleLinePrefixRegexStrings = SINGLE_LINE_COMMENT_PREFIXES.map(
      (p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    
    // WHAT_THIS_DO: 🤔 Build regex to match comment prefix + tag pattern
    // CONTEXT: 🌐 Pattern: (whitespace)(comment_marker)(whitespace)(TAG)
    const singleLineTagRegex = new RegExp(
      `(\\s*(${singleLinePrefixRegexStrings.join("|")})\\s*)(${escapedTag})`,
      "gm" // Global and multiline flags
    );

    let matchSL;
    while ((matchSL = singleLineTagRegex.exec(text)) !== null) {
      // EXPLANATION: 💬 Regex capture groups breakdown:
      // matchSL[0] = full match (e.g., "  // NOTE:")
      // matchSL[1] = comment prefix with whitespace (e.g., "  // ")
      // matchSL[2] = comment marker only (e.g., "//")
      // matchSL[3] = tag text (e.g., "NOTE:")

      // WHAT_THIS_DO: 🤔 Calculate precise position for decoration start
      // WHY: ❓ Start highlighting from comment marker, not preceding whitespace
      const commentMarkerStartIndexInPrefix = matchSL[1].indexOf(matchSL[2]);
      const highlightStartOffset = matchSL.index + commentMarkerStartIndexInPrefix;

      const highlightStartPosition = editor.document.positionAt(highlightStartOffset);

      // WHAT_THIS_DO: 🤔 Extend decoration to end of line for full comment highlighting
      const lineOfHighlight = editor.document.lineAt(highlightStartPosition.line);
      const highlightEndPosition = lineOfHighlight.range.end;

      // SECURITY: 🔒 Validate range before adding
      if (highlightStartPosition.isBeforeOrEqual(highlightEndPosition)) {
        rangesForThisTag.push(
          new vscode.Range(highlightStartPosition, highlightEndPosition)
        );
      }
    }

    // SECTION: 📑 Multi-Line Comment Detection
    // EXPLANATION: 💬 Find tags in block comments (e.g., /* TODO: */, <!-- NOTE: -->)
    for (const pattern of MULTI_LINE_COMMENT_PATTERNS) {
      if (pattern.tagAtStart) {
        // WHAT_THIS_DO: 🤔 Build regex for multi-line comment blocks
        // CONTEXT: 🌐 Pattern: comment_start + tag + content + comment_end
        const blockRegex = new RegExp(
          `${pattern.startDelimiterRegex}(${escapedTag})([\\s\\S]*?)${pattern.endDelimiterRegex}`,
          "gm"
        );

        let matchML;
        while ((matchML = blockRegex.exec(text)) !== null) {
          const blockStartIndex = matchML.index;
          // WHAT_THIS_DO: 🤔 Calculate end position including closing delimiter
          const blockEndIndex = matchML.index + matchML[0].length;

          const startPos = editor.document.positionAt(blockStartIndex);
          const endPos = editor.document.positionAt(blockEndIndex);
          
          // INFO: ℹ️ Highlight entire block comment for multi-line tags
          rangesForThisTag.push(new vscode.Range(startPos, endPos));
        }
      }
    }

    // WHAT_THIS_DO: 🤔 Add found ranges to decoration map if any matches found
    if (rangesForThisTag.length > 0) {
      const existingRanges = decorationsMap.get(decorationType) || [];
      decorationsMap.set(decorationType, existingRanges.concat(rangesForThisTag));
    }
  }

  // SECTION: 📑 Apply All Decorations
  // EXPLANATION: 💬 Apply collected decoration ranges to editor
  // PERFORMANCE: ⏱️ Batch application for better rendering performance
  activeDecorationTypes.forEach((decorationType) => {
    editor.setDecorations(
      decorationType,
      decorationsMap.get(decorationType) || []
    );
  });
}

// SECTION: 📑 Type Definitions and Interfaces
// EXPLANATION: 💬 Core data structures for extension functionality

/**
 * WHAT_THIS_DO: 🤔 Defines structure for comment tag configuration
 * WHY: ❓ Provides type safety and standardization for tag properties
 * CONTEXT: 🌐 Used throughout extension for tag styling and behavior
 */
interface CustomTag {
  tag: string;                // CONTEXT: 🌐 Tag text (e.g., "TODO:", "FIXME:")
  color?: string;             // CONTEXT: 🌐 Text color in hex format
  strikethrough?: boolean;    // CONTEXT: 🌐 Enable strikethrough decoration
  underline?: boolean;        // CONTEXT: 🌐 Enable underline decoration
  backgroundColor?: string;   // CONTEXT: 🌐 Background color for highlighting
  bold?: boolean;             // CONTEXT: 🌐 Enable bold font weight
  italic?: boolean;           // CONTEXT: 🌐 Enable italic font style
  emoji?: string;             // CONTEXT: 🌐 Emoji character for visual enhancement
  useEmoji?: boolean;         // CONTEXT: 🌐 Tag-specific emoji override setting
}

/**
 * WHAT_THIS_DO: 🤔 Defines VS Code snippet structure
 * WHY: ❓ Ensures proper snippet file generation and VS Code compatibility
 * CONTEXT: 🌐 Used for generating autocomplete snippets for comment tags
 */
interface Snippet {
  prefix: string;       // CONTEXT: 🌐 Trigger text for autocomplete
  scope?: string;       // CONTEXT: 🌐 Language scope limitation (optional)
  body: string[];       // CONTEXT: 🌐 Snippet content with placeholders
  description: string;  // CONTEXT: 🌐 Human-readable description
}

// SECTION: 📑 Snippet Management System
// EXPLANATION: 💬 Functions for generating and managing VS Code snippets for comment tags

/**
 * WHAT_THIS_DO: 🤔 Generates or clears snippet files based on custom tag configuration
 * WHY: ❓ Provides dynamic autocomplete functionality for user-defined tags
 * PERFORMANCE: ⏱️ Only processes user-defined tags to avoid snippet conflicts
 * @param context - VS Code extension context for file system access
 */
function updateCustomTagSnippets(context: vscode.ExtensionContext) {
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
    (tags: CustomTag[], type: "single-line" | "multi-line") => Record<string, Snippet>
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

    // SECTION: 📑 Generate Predefined Tag Snippets
    // EXPLANATION: 💬 Create snippets for built-in comment tags
    
    // WHAT_THIS_DO: 🤔 Generate single-line snippets for predefined tags
    const singleLinePredefinedSnippets = generator(PREDEFINED_COMMENT_TAGS, "single-line");
    writeSnippetsFile(
      context, 
      path.join(language, `single-line-${language}.code-snippets`), 
      singleLinePredefinedSnippets
    );

    // WHAT_THIS_DO: 🤔 Generate multi-line snippets for predefined tags
    const multiLinePredefinedSnippets = generator(PREDEFINED_COMMENT_TAGS, "multi-line");
    writeSnippetsFile(
      context, 
      path.join(language, `multi-line-${language}.code-snippets`), 
      multiLinePredefinedSnippets
    );

    // SECTION: 📑 Generate Custom Tag Snippets
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

/**
 * WHAT_THIS_DO: 🤔 Removes all custom snippet files from the file system
 * WHY: ❓ Cleanup function when no custom tags are defined
 * PERFORMANCE: ⏱️ Recursive deletion for complete cleanup
 * @param context - VS Code extension context for file system access
 */
function clearSnippetFiles(context: vscode.ExtensionContext) {
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

// SECTION: 📑 Language-Specific Snippet Generators
// EXPLANATION: 💬 Functions that create VS Code snippets for different programming languages

/**
 * WHAT_THIS_DO: 🤔 Generates snippets for C-style languages (JavaScript, TypeScript, C++, etc.)
 * WHY: ❓ Provides autocomplete functionality for // and /* `/ comment styles
 * CONTEXT: 🌐 Used by languages that support both single-line and multi-line comments
 * @param tags - Array of custom tags to generate snippets for
 * @param type - Whether to generate single-line or multi-line comment snippets
 * @returns Record of snippet names to snippet definitions
 */
function generateGeneralSnippets(
  tags: CustomTag[],
  type: "single-line" | "multi-line"
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

    // WHAT_THIS_DO: 🤔 Create human-readable snippet name
    const friendlyName = `${tagName.charAt(0).toUpperCase() + tagName.slice(1)} Comment`;

    // WHAT_THIS_DO: 🤔 Determine emoji usage based on tag and global settings
    const useEmoji = tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

    // WHAT_THIS_DO: 🤔 Build emoji string if enabled
    let emojiString = "";
    if (useEmoji) {
      emojiString = tag.emoji || getEmojiForTag(tagName);
      if (emojiString) {
        emojiString = `${emojiString}`;
      }
    }

    // SECTION: 📑 Snippet Generation by Comment Type
    if (type === "single-line") {
      // CONTEXT: 🌐 Single-line comment format: // TAG emoji content
      snippets[friendlyName] = {
        prefix: tagName,
        scope: "javascript,typescript,c,cpp,csharp,java",
        body: [`// ${tag.tag} ${emojiString} $1`],
        description: `Highlights ${tagName} comments`,
      };
    } else if (type === "multi-line") {
      // CONTEXT: 🌐 Multi-line comment format: /* TAG emoji content */
      snippets[friendlyName] = {
        prefix: tagName,
        scope: "javascript,typescript,c,cpp,csharp,java",
        body: [`/* ${tag.tag} ${emojiString} $1 */`],
        description: `Highlights ${tagName} comments`,
      };
    }
  });

  return snippets;
}

/**
 * WHAT_THIS_DO: 🤔 Generates snippets for Python hash-style comments
 * WHY: ❓ Provides autocomplete functionality for Python comment syntax
 * CONTEXT: 🌐 Python uses hash symbol for single-line comments
 * @param customTags - Array of custom tags to generate snippets for
 * @returns Record of snippet names to snippet definitions
 */
function generatePythonSnippets(
  customTags: CustomTag[]
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  customTags.forEach((tag) => {
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
    if (useEmoji) {
      // CONTEXT: 🌐 Use custom emoji if provided, otherwise fall back to mapped emoji
      emojiString = tag.emoji || getEmojiForTag(tagName);
      if (emojiString) {
        emojiString = `${emojiString}`;
      }
    }

    // CONTEXT: 🌐 Python comment format: hash TAG emoji content
    snippets[friendlyName] = {
      prefix: tagName,
      scope: "python",
      body: [`# ${tag.tag} ${emojiString} $1`],
      description: `Highlights ${tagName} comments`,
    };
  });

  return snippets;
}

/**
 * WHAT_THIS_DO: 🤔 Generates snippets for HTML/XML/SVG comment syntax
 * WHY: ❓ Provides autocomplete functionality for markup language comments
 * CONTEXT: 🌐 HTML, XML, and SVG use opening and closing comment tags
 * @param customTags - Array of custom tags to generate snippets for
 * @returns Record of snippet names to snippet definitions
 */
function generateHtmlSnippets(
  customTags: CustomTag[]
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  customTags.forEach((tag) => {
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
    if (useEmoji) {
      // CONTEXT: 🌐 Use custom emoji if provided, otherwise fall back to mapped emoji
      emojiString = tag.emoji || getEmojiForTag(tagName);
      if (emojiString) {
        emojiString = `${emojiString}`;
      }
    }

    // CONTEXT: 🌐 HTML comment format: opening tag + TAG + emoji + content + closing tag
    snippets[friendlyName] = {
      prefix: tagName,
      scope: "html,xml,svg",
      body: [`<!-- ${tag.tag} ${emojiString} $1 -->`],
      description: `Highlights ${tagName} comments`,
    };
  });

  return snippets;
}

// SECTION: 📑 Emoji Mapping System
// EXPLANATION: 💬 Functions for mapping tag names to appropriate emojis

/**
 * WHAT_THIS_DO: 🤔 Maps tag names to appropriate emoji characters
 * WHY: ❓ Provides fallback emojis when tags don't specify custom emojis
 * CONTEXT: 🌐 Enhances visual appeal and improves comment readability
 * @param tagName - Cleaned tag name without special characters
 * @returns Emoji character or default emoji if no mapping exists
 */
function getEmojiForTag(tagName: string): string {
  const normalizedTagName = tagName.toLowerCase().replace(":", "");
  
  // CONTEXT: 🌐 Mapping of common tag types to representative emojis
  const emojiMap: Record<string, string> = {
    explanation: "💬",      // Speech for explanations
    todo: "📋",            // Clipboard for tasks
    fixme: "🔧",           // Wrench for fixes
    bug: "🐛",             // Bug for issues
    hack: "⚡",            // Lightning for quick fixes
    note: "📝",            // Memo for notes
    info: "ℹ️",            // Information symbol
    idea: "💡",            // Light bulb for ideas
    debug: "🐞",           // Beetle for debugging
    why: "❓",             // Question mark for explanations
    what_this_do: "🤔",    // Thinking face for code explanation
    context: "🌐",         // Globe for context
    critical: "⚠️",        // Warning for critical items
    review: "👁️",          // Eye for review requests
    optimize: "🚀",        // Rocket for performance
    section: "📑",         // Document for sections
    next_step: "➡️",       // Arrow for next steps
    security: "🔒",        // Lock for security
    performance: "⏱️",     // Stopwatch for performance
    deprecated: "⛔",       // No entry for deprecated
    api: "🔌",             // Plug for API
  };
  
  // WHAT_THIS_DO: 🤔 Return mapped emoji or default sparkles
  return emojiMap[normalizedTagName] || "✨";
}

// SECTION: 📑 Color Utility Namespace
// EXPLANATION: 💬 Utilities for color manipulation and conversion

/**
 * WHAT_THIS_DO: 🤔 Collection of color utility functions for theme compatibility
 * WHY: ❓ Provides color format conversion and alpha channel handling
 * CONTEXT: 🌐 Used for advanced color configuration in tag styling
 */
namespace ColorUtils {
  /**
   * WHAT_THIS_DO: 🤔 Parses hex color strings with optional alpha component
   * WHY: ❓ Enables support for transparent and semi-transparent colors
   * @param hex - Color in hex format (#RRGGBB or #RRGGBBAA)
   * @returns Object with separated hex color and alpha values
   */
  export function parseHexWithAlpha(hex: string): {
    hex: string;
    alpha: number;
  } {
    // SECURITY: 🔒 Handle invalid or transparent values
    if (!hex || hex === "transparent") {
      return { hex: "#000000", alpha: 0 };
    }

    // WHAT_THIS_DO: 🤔 Handle standard 6-character hex color
    if (hex.length === 7) {
      return { hex, alpha: 1 };
    }

    // WHAT_THIS_DO: 🤔 Handle 8-character hex with alpha channel
    if (hex.length === 9) {
      const alpha = parseInt(hex.substring(7, 9), 16) / 255;
      return {
        hex: hex.substring(0, 7),
        alpha,
      };
    }

    // SECURITY: 🔒 Fallback for invalid format
    return { hex, alpha: 1 };
  }

  /**
   * WHAT_THIS_DO: 🤔 Converts hex color and alpha to CSS rgba format
   * WHY: ❓ Provides CSS-compatible color values for styling
   * @param hex - Hex color string
   * @param alpha - Alpha transparency value (0-1)
   * @returns CSS rgba() string or "transparent"
   */
  export function hexAlphaToRgba(hex: string, alpha: number): string {
    // OPTIMIZE: 🚀 Early return for fully transparent
    if (alpha === 0) return "transparent";

    // WHAT_THIS_DO: 🤔 Extract RGB components from hex
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * WHAT_THIS_DO: 🤔 Converts hex color and alpha to 8-character hex format
   * WHY: ❓ Creates hex colors with alpha channel for broader compatibility
   * @param hex - Base hex color string
   * @param alpha - Alpha transparency value (0-1)
   * @returns Hex color with alpha channel (#RRGGBBAA) or "transparent"
   */
  export function toHexWithAlpha(hex: string, alpha: number): string {
    // OPTIMIZE: 🚀 Early return for fully transparent
    if (alpha === 0) return "transparent";

    // WHAT_THIS_DO: 🤔 Convert alpha to hex and ensure 2-digit format
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    
    return `${hex}${alphaHex}`;
  }
}

// SECTION: 📂 Snippet File Writer Utility
// EXPLANATION: 💬 Low-level file operations for writing snippet data to disk

/**
 * WHAT_THIS_DO: 🤔 Writes snippet data to a file in the snippets directory
 * WHY: ❓ Provides centralized file writing logic with error handling
 * CONTEXT: 🌐 Used by snippet generation functions to persist data
 * @param context - Extension context providing path information
 * @param filename - Target filename for the snippet file
 * @param snippets - Snippet data object to write to file
 */
function writeSnippetsFile(
  context: vscode.ExtensionContext,
  filename: string,
  snippets: Record<string, Snippet>
): void {
  try {
    // WHAT_THIS_DO: 🤔 Construct path to snippets directory
    const snippetsDir = path.join(context.extensionPath, "snippets");

    // SECURITY: 🔒 Ensure snippets directory exists before writing
    if (!fs.existsSync(snippetsDir)) {
      fs.mkdirSync(snippetsDir, { recursive: true });
    }
    
    // WHAT_THIS_DO: 🤔 Build complete file path for snippet file
    const filePath = path.join(snippetsDir, filename);
    
    // WHAT_THIS_DO: 🤔 Write file only if snippets exist, otherwise clean up
    if (Object.keys(snippets).length > 0) {
      // PERFORMANCE: 🚀 Write formatted JSON with proper indentation
      fs.writeFileSync(filePath, JSON.stringify(snippets, null, 2), "utf8");
      console.log(`✅ Snippets written to ${filePath}`);
    } else if (fs.existsSync(filePath)) {
      // CLEANUP: 🧹 Remove empty snippet files to avoid clutter
      fs.unlinkSync(filePath);
      console.log(`🗑️ Removed empty snippet file: ${filePath}`);
    }
  } catch (error: any) {
    // ERROR: ❌ Handle file operation failures gracefully
    // SECURITY: 🔒 Explicitly type error to prevent any-type issues
    console.error(`❌ Error writing snippets file ${filename}: ${error.message}`);
  }
}

// SECTION: 🔌 Extension Deactivation Handler
// EXPLANATION: 💬 Cleanup operations when extension is deactivated

/**
 * WHAT_THIS_DO: 🤔 Called when the extension is deactivated by VS Code
 * WHY: ❓ Ensures proper cleanup of resources and timers
 * CONTEXT: 🌐 Part of VS Code extension lifecycle management
 */
export function deactivate() {
  // CLEANUP: 🧹 Remove all active text decorations
  clearAllDecorations();
  
  // CLEANUP: 🧹 Cancel any pending decoration updates
  if (decorationTimeout) {
    clearTimeout(decorationTimeout);
  }
  
  // DEBUG: 📋 Log successful deactivation
  console.log("🔌 Comment Chameleon extension deactivated");
}
