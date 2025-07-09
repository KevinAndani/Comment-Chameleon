import * as vscode from "vscode";
import { TagEditorPanel } from "./tagEditor";
import { LanguageEditorPanel } from "./tagEditor"; // Corrected import
import * as fs from "fs";
import * as path from "path";

// Predefined tags (formerly enhancedCommentTags)
const PREDEFINED_COMMENT_TAGS: CustomTag[] = [
  {
    tag: "//", // General comment style, can be used for default styling if needed
    color: "#6272a4", // Example: Dracula comment color
    strikethrough: false, // Usually not strikethrough by default
    underline: false,
    backgroundColor: "transparent",
    // Note: A plain "//" tag might be too broad for specific highlighting.
    // Consider if this is needed or if only keyword tags are styled.
  },
  {
    tag: "EXPLANATION:",
    color: "#ff70b3",
    strikethrough: false,
    underline: false,
    backgroundColor: "transparent",
    emoji: "💬",
  },
  {
    tag: "TODO:",
    color: "#ffc66d",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📋",
  },
  {
    tag: "FIXME:",
    color: "#ff6e6e",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🔧",
  },
  {
    tag: "BUG:",
    color: "#f8f8f2",
    strikethrough: false,
    backgroundColor: "#bb80ff",
    emoji: "🐛",
  },
  {
    tag: "HACK:",
    color: "#ffffa5",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "⚡",
  },
  {
    tag: "NOTE:",
    color: "#94f0ff",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📝",
  },
  {
    tag: "INFO:",
    color: "#c798e6",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "ℹ️",
  },
  {
    tag: "IDEA:",
    color: "#80ffce",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "💡",
  },
  {
    tag: "DEBUG:",
    color: "#ff2975",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🐞",
  },
  {
    tag: "WHY:",
    color: "#ff9580",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "❓",
  },
  {
    tag: "WHAT THIS DO:",
    color: "#FBBF24",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🤔",
  },
  {
    tag: "CONTEXT:",
    color: "#d8ff80",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🌐",
  },
  {
    tag: "CRITICAL:",
    color: "#FFFFFF",
    strikethrough: false,
    backgroundColor: "#9F1239", // Dark red
    bold: true,
    emoji: "⚠️",
  },
  {
    tag: "REVIEW:",
    color: "#A5B4FC",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "👁️",
  },
  {
    tag: "OPTIMIZE:",
    color: "#4ADE80",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🚀",
  },
  {
    tag: "SECTION:",
    color: "#f1a18e",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "📑",
  },
  {
    tag: "NEXT STEP:",
    color: "#ba6645",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "➡️",
  },
  {
    tag: "SECURITY:",
    color: "#cff028",
    strikethrough: false,
    backgroundColor: "#44475a",
    emoji: "🔒",
  },
  {
    tag: "PERFORMANCE:",
    color: "#d7ffad",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "⏱️",
  },
  {
    tag: "DEPRECATED:",
    color: "#8b8098",
    strikethrough: true,
    backgroundColor: "#44475a",
    emoji: "⛔",
  },
  {
    tag: "API:",
    color: "#c798e6",
    strikethrough: false,
    backgroundColor: "transparent",
    emoji: "🔌",
  },
];

// Store for decoration types to reuse and dispose
let activeDecorationTypes: Map<string, vscode.TextEditorDecorationType> =
  new Map();
let decorationTimeout: NodeJS.Timeout | undefined = undefined;

// Helper function to get only user-defined custom tags from configuration
function getCustomTagsFromConfig(): CustomTag[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const rawCustomTags = config.get<CustomTag[]>("customTags");
  return Array.isArray(rawCustomTags) ? rawCustomTags : [];
}

// Export UserDefinedLanguage and getUserDefinedLanguages
export interface UserDefinedLanguage {
  languageName: string;
  singleLinePrefix: string;
  multiLinePrefix: string;
  multiLineSuffix: string;
}

export function getUserDefinedLanguages(): UserDefinedLanguage[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const languages = config.get<UserDefinedLanguage[]>("userDefinedLanguages");
  return Array.isArray(languages) ? languages : [];
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Comment Chameleon is now active");
  console.log(
    "Available commands:",
    vscode.commands
      .getCommands(true)
      .then((commands) =>
        commands.filter((cmd) => cmd.includes("comment-chameleon"))
      )
      .then((commands) => console.log("Filtered commands:", commands))
  );

  // Initial decoration of active editor
  if (vscode.window.activeTextEditor) {
    triggerUpdateDecorations(vscode.window.activeTextEditor);
  }

  // Generate snippets for custom tags
  updateCustomTagSnippets(context);

  // Register command to manually apply styles
  const applyStylesCommand = vscode.commands.registerCommand(
    "comment-chameleon.applyStyles",
    () => {
      clearAllDecorations(); // Clear old decoration types
      if (vscode.window.activeTextEditor) {
        triggerUpdateDecorations(vscode.window.activeTextEditor, true); // Force immediate update
      }
      updateCustomTagSnippets(context);
      vscode.window.showInformationMessage(
        "Comment Chameleon: Styles refreshed successfully!"
      );
    }
  );
  // Register command to edit custom tags
  const editTagsCommand = vscode.commands.registerCommand(
    "comment-chameleon.editTags",
    () => {
      TagEditorPanel.createOrShow(context.extensionUri);
    }
  );
  // Register command to edit custom languages
  const editLanguagesCommand = vscode.commands.registerCommand(
    "comment-chameleon.editLanguages",
    () => {
      LanguageEditorPanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(
    applyStylesCommand,
    editTagsCommand,
    editLanguagesCommand
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        if (
          e.affectsConfiguration("commentChameleon.customTags") ||
          e.affectsConfiguration("commentChameleon.useEmojis")
        ) {
          clearAllDecorations(); // Recreate decoration types on config change
          if (vscode.window.activeTextEditor) {
            triggerUpdateDecorations(vscode.window.activeTextEditor, true);
          }
          updateCustomTagSnippets(context);
        }
      }
    )
  );

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        triggerUpdateDecorations(editor);
      }
    })
  );

  // Listen for text document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (
        vscode.window.activeTextEditor &&
        event.document === vscode.window.activeTextEditor.document
      ) {
        triggerUpdateDecorations(vscode.window.activeTextEditor);
      }
    })
  );

  // Add to your activate function
  const checkSnippetsCommand = vscode.commands.registerCommand(
    "comment-chameleon.checkSnippets",
    () => {
      const snippetsDir = path.join(context.extensionPath, "snippets");
      const snippetFiles = fs.readdirSync(snippetsDir);

      vscode.window.showInformationMessage(
        `Found ${snippetFiles.length} snippet files: ${snippetFiles.join(", ")}`
      );

      // Try to read one snippet file to verify content
      if (snippetFiles.includes("general-custom.code-snippets")) {
        const content = fs.readFileSync(
          path.join(snippetsDir, "general-custom.code-snippets"),
          "utf8"
        );
        console.log("Sample snippet content:", content);
      }
    }
  );

  context.subscriptions.push(checkSnippetsCommand);

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ["javascript", "typescript", "python", "html", "c"], // Extend as needed
      {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
          const line = document.lineAt(position);
          const trimmedText = line.text.trim();

          // Get the text before the cursor
          const textBeforeCursor = trimmedText.slice(0, position.character).toLowerCase();

          // Get custom tags from configuration
          const config = vscode.workspace.getConfiguration("commentChameleon");
          const customTags = config.get<CustomTag[]>("customTags") || [];

          // Merge predefined tags with custom tags
          const allTags = [...PREDEFINED_COMMENT_TAGS, ...customTags];

          // Filter tags based on the text before the cursor
          const filteredTags = allTags.filter((tagObj) =>
            tagObj.tag.toLowerCase().startsWith(textBeforeCursor)
          );

          // Map filtered tags to completion items
          return filteredTags.map((tagObj: CustomTag): vscode.CompletionItem => {
            const item = new vscode.CompletionItem(
              tagObj.tag,
              vscode.CompletionItemKind.Snippet
            );

            // Use the snippet body defined in the snippet files
            const languageId = document.languageId; // Get the current language
            const commentPrefix = getCommentPrefix(languageId); // Get the correct comment prefix
            const commentSuffix = getCommentSuffix(languageId); // Get the correct comment suffix (if any)

            // Generate the snippet body dynamically
            const snippetBody = `${commentPrefix} ${tagObj.tag} ${tagObj.emoji || ""} $1 ${commentSuffix}`.trim();

            item.insertText = new vscode.SnippetString(snippetBody); // Use SnippetString for dynamic placeholders
            item.detail = "Custom Comment Tag";
            item.documentation = `Insert the ${tagObj.tag} tag with appropriate comment syntax.`;
            return item;
          });
        },
      },
      "/",
      ":" // Trigger characters
    )
  );
}

function getCommentPrefix(languageId: string): string {
  const userLanguages = getUserDefinedLanguages();
  const userLanguage = userLanguages.find(
    (lang) => lang.languageName.toLowerCase() === languageId.toLowerCase()
  );
  if (userLanguage) {
    return userLanguage.singleLinePrefix;
  }

  const commentPrefixes: Record<string, string> = {
    python: "#", // Python uses #
    javascript: "//", // JavaScript uses //
    typescript: "//", // TypeScript uses //
    c: "//", // C uses //
    cpp: "//", // C++ uses //
    csharp: "//", // C# uses //
    java: "//", // Java uses //
    html: "<!--", // HTML uses <!-- -->
    xml: "<!--", // XML uses <!-- -->
    svg: "<!--", // SVG uses <!-- -->
  };
  return commentPrefixes[languageId] || "//"; // Default to //
}

function getCommentSuffix(languageId: string): string {
  const userLanguages = getUserDefinedLanguages();
  const userLanguage = userLanguages.find(
    (lang) => lang.languageName.toLowerCase() === languageId.toLowerCase()
  );
  if (userLanguage) {
    return userLanguage.multiLineSuffix;
  }

  const commentSuffixes: Record<string, string> = {
    html: "-->", // HTML requires a closing comment
    xml: "-->", // XML requires a closing comment
    svg: "-->", // SVG requires a closing comment
  };
  return commentSuffixes[languageId] || ""; // Default to no suffix
}

function triggerUpdateDecorations(
  editor: vscode.TextEditor,
  immediate: boolean = false
) {
  if (decorationTimeout) {
    clearTimeout(decorationTimeout);
    decorationTimeout = undefined;
  }
  if (immediate) {
    updateDecorationsForEditor(editor);
  } else {
    decorationTimeout = setTimeout(
      () => updateDecorationsForEditor(editor),
      500
    );
  }
}

function getMergedTags(): CustomTag[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const rawCustomTags = config.get<CustomTag[]>("customTags");
  const customTags = getCustomTagsFromConfig();
  // Give precedence to custom tags if they redefine a predefined tag's text
  const predefinedTagsFiltered = PREDEFINED_COMMENT_TAGS.filter(
    (predefined) => !customTags.some((custom) => custom.tag === predefined.tag)
  );
  return [...predefinedTagsFiltered, ...customTags];
}

function getDecorationTypeForTag(
  tag: CustomTag
): vscode.TextEditorDecorationType {
  const decorationKey = JSON.stringify({
    color: tag.color,
    backgroundColor: tag.backgroundColor,
    strikethrough: tag.strikethrough,
    underline: tag.underline,
    bold: tag.bold,
    italic: tag.italic,
    // Add other style properties if they affect visual appearance directly
  });

  if (activeDecorationTypes.has(decorationKey)) {
    return activeDecorationTypes.get(decorationKey)!;
  }

  let textDecoration = "";
  if (tag.strikethrough && tag.underline) {
    textDecoration = "underline line-through";
  } else if (tag.strikethrough) {
    textDecoration = "line-through";
  } else if (tag.underline) {
    textDecoration = "underline";
  }

  const options: vscode.DecorationRenderOptions = {
    color: tag.color,
    backgroundColor: tag.backgroundColor,
    textDecoration: textDecoration || undefined, // Important: use undefined if no decoration
    fontWeight: tag.bold ? "bold" : undefined,
    fontStyle: tag.italic ? "italic" : undefined,
    // rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed, // Default
  };

  // Ensure light/dark theme compatibility if not explicitly set
  if (!options.color && !options.backgroundColor) {
    // Fallback or ensure contrast, this is a simple example
    options.color = new vscode.ThemeColor("editorCodeLens.foreground");
  }

  const decorationType = vscode.window.createTextEditorDecorationType(options);
  activeDecorationTypes.set(decorationKey, decorationType);
  return decorationType;
}

// Helper function to get emoji for tag type with consistent formatting
function generateSnippetBodyWithEmoji(
  tag: CustomTag,
  commentPrefix: string,
  commentSuffix: string = ""
): string[] {
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  // Determine if we should use emoji for this tag
  const useEmoji =
    tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

  // Select appropriate emoji based on user preference
  let emojiString = "";
  if (useEmoji && tag.emoji) {
    emojiString = ` ${tag.emoji}`;
  }

  return [`${commentPrefix}${tag.tag}${emojiString} $1${commentSuffix}`];
}

function clearAllDecorations() {
  activeDecorationTypes.forEach((type) => type.dispose());
  activeDecorationTypes.clear();
  // Also clear decorations from all visible editors
  vscode.window.visibleTextEditors.forEach((editor) => {
    // This needs a way to know which decoration types were applied by this extension
    // For simplicity, if we re-create all types, we can just clear all.
    // However, a more robust way is to keep track of applied decorations per editor.
    // For now, this clear is for the `activeDecorationTypes` map.
    // The `updateDecorationsForEditor` will clear specific decorations.
  });
}

// Define common single-line comment prefixes for more precise matching
const SINGLE_LINE_COMMENT_PREFIXES = ["//", "#", "--"];

// Define patterns for multi-line comments.
// The regex will be constructed to find the tag shortly after the start delimiter.
interface MultiLineCommentPattern {
  name: string; // For debugging or future specific logic
  startDelimiterRegex: string; // Regex for the start of the block, e.g., /\/\*/
  endDelimiterRegex: string; // Regex for the end of the block, e.g., /\*\//
  // If true, the tag must appear immediately after the start delimiter (and optional whitespace).
  // If false, a more complex regex might be needed to find the tag within the block (not implemented here for simplicity).
  tagAtStart: true;
}

const MULTI_LINE_COMMENT_PATTERNS: MultiLineCommentPattern[] = [
  {
    name: "c-style",
    startDelimiterRegex: "/\\*\\s*",
    endDelimiterRegex: "\\*\\/",
    tagAtStart: true,
  }, // e.g., /* TAG ... */
  {
    name: "html-style",
    startDelimiterRegex: "<!--\\s*",
    endDelimiterRegex: "-->",
    tagAtStart: true,
  }, // e.g., <!-- TAG ... -->
  // NOTE: 📝 Python-style docstrings/block comments (can be tricky due to regular strings)
  // These are simplified; robust Python parsing is harder.
  {
    name: "python-triple-double-quotes",
    startDelimiterRegex: '"""\\s*',
    endDelimiterRegex: '"""',
    tagAtStart: true,
  },
  {
    name: "python-triple-single-quotes",
    startDelimiterRegex: "'''\\s*",
    endDelimiterRegex: "'''",
    tagAtStart: true,
  },
];

function updateDecorationsForEditor(editor: vscode.TextEditor) {
  if (!editor || !editor.document) return;

  const allTags = getMergedTags();
  if (allTags.length === 0) {
    // Clear any existing decorations if no tags are defined
    activeDecorationTypes.forEach((decorationType) => {
      editor.setDecorations(decorationType, []);
    });
    return;
  }

  const text = editor.document.getText();
  const decorationsMap: Map<vscode.TextEditorDecorationType, vscode.Range[]> =
    new Map();

  for (const tagDefinition of allTags) {
    const decorationType = getDecorationTypeForTag(tagDefinition);
    // Ensure each decoration type is initialized in the map to handle clearing previous decorations
    if (!decorationsMap.has(decorationType)) {
      decorationsMap.set(decorationType, []);
    }
    const rangesForThisTag: vscode.Range[] = [];

    const escapedTag = tagDefinition.tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 1. Single-Line Comment Matching
    // This regex looks for common single-line comment markers followed by the specific tag.
    // It's refined to use specific prefixes.
    const singleLinePrefixRegexStrings = SINGLE_LINE_COMMENT_PREFIXES.map(
      (p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape the prefix itself
    );
    const singleLineTagRegex = new RegExp(
      `(\\s*(${singleLinePrefixRegexStrings.join("|")})\\s*)(${escapedTag})`,
      "gm"
    );

    let matchSL;
    while ((matchSL = singleLineTagRegex.exec(text)) !== null) {
      // matchSL[0] is the full match, e.g., "  // NOTE:"
      // matchSL[1] is the comment prefix part, e.g., "  // " (captured by `\\s*(${singleLinePrefixRegexStrings.join("|")})\\s*`)
      // matchSL[2] is the comment marker itself, e.g., "//" (captured by `(${singleLinePrefixRegexStrings.join("|")})`)
      // matchSL[3] is the tag, e.g., "NOTE:" (captured by `(${escapedTag})`)

      // Calculate the offset where the highlight should begin.
      // We want to start at the beginning of the actual comment marker (matchSL[2]).
      // The start of matchSL[1] is at matchSL.index.
      // The marker matchSL[2] is found within matchSL[1].
      // So, the offset of the marker from the start of the whole match (matchSL.index)
      // is matchSL.index + (the index of matchSL[2] within matchSL[1]).
      const commentMarkerStartIndexInPrefix = matchSL[1].indexOf(matchSL[2]);
      const highlightStartOffset =
        matchSL.index + commentMarkerStartIndexInPrefix;

      const highlightStartPosition =
        editor.document.positionAt(highlightStartOffset);

      // Extend the decoration to the end of the line where the tag is found.
      const lineOfHighlight = editor.document.lineAt(
        highlightStartPosition.line
      );
      const highlightEndPosition = lineOfHighlight.range.end;

      if (highlightStartPosition.isBeforeOrEqual(highlightEndPosition)) {
        rangesForThisTag.push(
          new vscode.Range(highlightStartPosition, highlightEndPosition)
        );
      }
    }

    // 2. Multi-Line Comment Block Matching
    for (const pattern of MULTI_LINE_COMMENT_PATTERNS) {
      if (pattern.tagAtStart) {
        // Construct regex: pattern.startDelimiterRegex + escapedTag + anythingUntil + pattern.endDelimiterRegex
        // The 's' flag (dotAll) would be ideal here if universally supported in JS engines VS Code runs on,
        // otherwise use [\s\S]*? for non-greedy multi-line content.
        const blockRegex = new RegExp(
          `${pattern.startDelimiterRegex}(${escapedTag})([\\s\\S]*?)${pattern.endDelimiterRegex}`,
          "gm"
        );

        let matchML;
        while ((matchML = blockRegex.exec(text)) !== null) {
          const blockStartIndex = matchML.index;
          // matchML[0] is the entire matched block, including delimiters and content.
          const blockEndIndex = matchML.index + matchML[0].length;

          const startPos = editor.document.positionAt(blockStartIndex);
          const endPos = editor.document.positionAt(blockEndIndex);
          // For multi-line, we decorate the entire block.
          rangesForThisTag.push(new vscode.Range(startPos, endPos));
        }
      }
    }

    if (rangesForThisTag.length > 0) {
      // Add to map, potentially merging with ranges from other types of matches for the same decoration
      // For now, simple concatenation; VS Code handles overlapping ranges for the same decoration type.
      const existingRanges = decorationsMap.get(decorationType) || [];
      decorationsMap.set(
        decorationType,
        existingRanges.concat(rangesForThisTag)
      );
    }
  }

  // Apply all decorations, clearing old ones for these types
  activeDecorationTypes.forEach((decorationType) => {
    editor.setDecorations(
      decorationType,
      decorationsMap.get(decorationType) || []
    );
  });
}

/**
 * Represents a single comment tag configuration
 */
interface CustomTag {
  tag: string;
  color?: string;
  strikethrough?: boolean;
  underline?: boolean;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  emoji?: string;
  useEmoji?: boolean;
}

/**
 * Represents a VS Code snippet definition
 */
interface Snippet {
  prefix: string;
  scope?: string;
  body: string[];
  description: string;
}

/**
 * Updates snippet files with custom tags
 */
function updateCustomTagSnippets(context: vscode.ExtensionContext) {
  const customTags = getCustomTagsFromConfig(); // Fetch only custom tags for snippets

  if (customTags.length === 0) {
    console.log(
      "No user-defined custom tags found, clearing custom snippet files."
    );
    clearSnippetFiles(context); // This correctly clears only custom snippet files
    return;
  }

  console.log(
    `Generating custom snippets for ${customTags.length} user-defined tags.`
  );

  // Generate snippets for each language separately
  const languageSnippetGenerators: Record<string, (tags: CustomTag[], type: "single-line" | "multi-line") => Record<string, Snippet>> = {
    javascript: generateGeneralSnippets,
    typescript: generateGeneralSnippets,
    c: generateGeneralSnippets,
    cpp: generateGeneralSnippets,
    csharp: generateGeneralSnippets,
    java: generateGeneralSnippets,
    python: generatePythonSnippets,
    html: generateHtmlSnippets,
    xml: generateHtmlSnippets,
    svg: generateHtmlSnippets,
  };

  for (const [language, generator] of Object.entries(languageSnippetGenerators)) {
    const languageDir = path.join(context.extensionPath, "snippets", language);

    // Ensure the language-specific directory exists
    if (!fs.existsSync(languageDir)) {
      fs.mkdirSync(languageDir, { recursive: true });
    }

    // Generate predefined single-line snippets
    const singleLinePredefinedSnippets = generator(PREDEFINED_COMMENT_TAGS, "single-line");
    writeSnippetsFile(context, path.join(language, `single-line-${language}.code-snippets`), singleLinePredefinedSnippets);

    // Generate predefined multi-line snippets
    const multiLinePredefinedSnippets = generator(PREDEFINED_COMMENT_TAGS, "multi-line");
    writeSnippetsFile(context, path.join(language, `multi-line-${language}.code-snippets`), multiLinePredefinedSnippets);

    // Generate custom single-line snippets
    const singleLineCustomSnippets = generator(customTags, "single-line");
    writeSnippetsFile(context, path.join(language, `single-line-${language}-custom.code-snippets`), singleLineCustomSnippets);

    // Generate custom multi-line snippets
    const multiLineCustomSnippets = generator(customTags, "multi-line");
    writeSnippetsFile(context, path.join(language, `multi-line-${language}-custom.code-snippets`), multiLineCustomSnippets);
  }
}

function clearSnippetFiles(context: vscode.ExtensionContext) {
  const snippetsDir = path.join(context.extensionPath, "snippets");

  // Remove all custom snippet files for supported languages
  const supportedLanguages = [
    "javascript",
    "typescript",
    "c",
    "cpp",
    "csharp",
    "java",
    "python",
    "html",
    "xml",
    "svg",
  ];

  for (const language of supportedLanguages) {
    const languageDir = path.join(snippetsDir, language);

    if (fs.existsSync(languageDir)) {
      fs.rmSync(languageDir, { recursive: true, force: true });
    }
  }

  console.log("Cleared custom snippet files.");
}

function generateGeneralSnippets(
  tags: CustomTag[],
  type: "single-line" | "multi-line"
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  tags.forEach((tag) => {
    const tagName = tag.tag
      .replace(":", "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");
    if (!tagName) return;

    const friendlyName = `${
      tagName.charAt(0).toUpperCase() + tagName.slice(1)
    } Comment`;

    const useEmoji =
      tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

    let emojiString = "";
    if (useEmoji) {
      emojiString = tag.emoji || getEmojiForTag(tagName);
      if (emojiString) {
        emojiString = `${emojiString}`;
      }
    }

    if (type === "single-line") {
      snippets[friendlyName] = {
        prefix: tagName,
        scope: "javascript,typescript,c,cpp,csharp,java",
        body: [`// ${tag.tag} ${emojiString} $1`],
        description: `Highlights ${tagName} comments`,
      };
    } else if (type === "multi-line") {
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
 * Generates snippets for Python (# style comments)
 */
function generatePythonSnippets(
  customTags: CustomTag[]
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  customTags.forEach((tag) => {
    const tagName = tag.tag
      .replace(":", "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");
    if (!tagName) return;

    const friendlyName = `${
      tagName.charAt(0).toUpperCase() + tagName.slice(1)
    } Comment`;

    // Determine if we should use emoji for this tag
    const useEmoji =
      tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

    // Select appropriate emoji based on user preference
    let emojiString = "";
    if (useEmoji) {
      // Use custom emoji if provided, otherwise fall back to mapped emoji
      emojiString = tag.emoji || getEmojiForTag(tagName);
      if (emojiString) {
        emojiString = `${emojiString}`;
      }
    }

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
 * Generates snippets for HTML (<!-- --> style comments)
 */
function generateHtmlSnippets(
  customTags: CustomTag[]
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("commentChameleon");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  customTags.forEach((tag) => {
    const tagName = tag.tag
      .replace(":", "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");
    if (!tagName) return;

    const friendlyName = `${
      tagName.charAt(0).toUpperCase() + tagName.slice(1)
    } Comment`;

    // Determine if we should use emoji for this tag
    const useEmoji =
      tag.useEmoji !== undefined ? tag.useEmoji : globalEmojiSetting;

    // Select appropriate emoji based on user preference
    let emojiString = "";
    if (useEmoji) {
      // Use custom emoji if provided, otherwise fall back to mapped emoji
      emojiString = tag.emoji || getEmojiForTag(tagName);
      if (emojiString) {
        emojiString = `${emojiString}`;
      }
    }

    snippets[friendlyName] = {
      prefix: tagName,
      scope: "html,xml,svg",
      body: [`<!-- ${tag.tag} ${emojiString} $1 -->`],
      description: `Highlights ${tagName} comments`,
    };
  });

  return snippets;
}

/**
 * Returns an appropriate emoji for a given tag type
 */
function getEmojiForTag(tagName: string): string {
  const normalizedTagName = tagName.toLowerCase().replace(":", "");
  const emojiMap: Record<string, string> = {
    explanation: "💬",
    todo: "📋",
    fixme: "🔧",
    bug: "🐛",
    hack: "⚡",
    note: "📝",
    info: "ℹ️",
    idea: "💡",
    debug: "🐞",
    why: "❓",
    what_this_do: "🤔", // Combined for mapping
    context: "🌐",
    critical: "⚠️",
    review: "👁️",
    optimize: "🚀",
    section: "📑",
    next_step: "➡️", // Combined
    security: "🔒",
    performance: "⏱️",
    deprecated: "⛔",
    api: "🔌",
  };
  return emojiMap[normalizedTagName] || "✨"; // Default emoji
}

/**
 * Color utility functions
 */
namespace ColorUtils {
  /**
   * Parses a hex color with optional alpha component
   * @param hex Color in hex format (#RRGGBB or #RRGGBBAA)
   */
  export function parseHexWithAlpha(hex: string): {
    hex: string;
    alpha: number;
  } {
    if (!hex || hex === "transparent") {
      return { hex: "#000000", alpha: 0 };
    }

    // Standard hex color without alpha
    if (hex.length === 7) {
      return { hex, alpha: 1 };
    }

    // Hex with alpha
    if (hex.length === 9) {
      const alpha = parseInt(hex.substring(7, 9), 16) / 255;
      return {
        hex: hex.substring(0, 7),
        alpha,
      };
    }

    // Invalid format, return as is
    return { hex, alpha: 1 };
  }

  /**
   * Converts hex and alpha to rgba() format
   */
  export function hexAlphaToRgba(hex: string, alpha: number): string {
    if (alpha === 0) return "transparent";

    // Parse the hex color
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Converts hex and alpha value to #RRGGBBAA format
   */
  export function toHexWithAlpha(hex: string, alpha: number): string {
    if (alpha === 0) return "transparent";

    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${hex}${alphaHex}`;
  }
}

/**
 * Writes snippet data to a file in the snippets directory
 */
function writeSnippetsFile(
  context: vscode.ExtensionContext,
  filename: string,
  snippets: Record<string, Snippet>
): void {
  try {
    const snippetsDir = path.join(context.extensionPath, "snippets");

    // Ensure snippets directory exists
    if (!fs.existsSync(snippetsDir)) {
      fs.mkdirSync(snippetsDir, { recursive: true });
    }
    const filePath = path.join(snippetsDir, filename);
    if (Object.keys(snippets).length > 0) {
      fs.writeFileSync(filePath, JSON.stringify(snippets, null, 2), "utf8");
      console.log(`Snippets written to ${filePath}`);
    } else if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Remove snippet file if no snippets
      console.log(`Removed empty snippet file: ${filePath}`);
    }
  } catch (error: any) {
    // Explicitly type error as any or unknown
    console.error(`Error writing snippets file ${filename}: ${error.message}`);
  }
}

export function deactivate() {
  clearAllDecorations();
  if (decorationTimeout) {
    clearTimeout(decorationTimeout);
  }
}
