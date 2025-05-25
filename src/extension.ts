import * as vscode from "vscode";
import { TagEditorPanel } from "./tagEditor";
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

export function activate(context: vscode.ExtensionContext) {
  console.log("Better Comments Enhanced is now active");
  console.log(
    "Available commands:",
    vscode.commands
      .getCommands(true)
      .then((commands) =>
        commands.filter((cmd) => cmd.includes("better-comments"))
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
    "better-comments-enhanced.applyStyles",
    () => {
      clearAllDecorations(); // Clear old decoration types
      if (vscode.window.activeTextEditor) {
        triggerUpdateDecorations(vscode.window.activeTextEditor, true); // Force immediate update
      }
      updateCustomTagSnippets(context);
      vscode.window.showInformationMessage(
        "Comment styles refreshed successfully!"
      );
    }
  );
  // Register command to edit custom tags
  const editTagsCommand = vscode.commands.registerCommand(
    "better-comments-enhanced.editTags",
    () => {
      TagEditorPanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(applyStylesCommand, editTagsCommand);

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        if (
          e.affectsConfiguration("betterCommentsEnhanced.customTags") ||
          e.affectsConfiguration("betterCommentsEnhanced.useEmojis")
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
  const config = vscode.workspace.getConfiguration("betterCommentsEnhanced");
  const rawCustomTags = config.get<CustomTag[]>("customTags");
  const customTags = Array.isArray(rawCustomTags) ? rawCustomTags : [];
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

  // Regex to find potential comments and tags
  // This is a simplified regex and might need adjustments for various languages/comment styles
  // It looks for common single-line comment markers and then captures the tag
  // Group 1: Comment marker (e.g., //, #, --)
  // Group 2: The tag itself (e.g., TODO:, FIXME)
  // Group 3: The rest of the comment
  const commentRegex = /(\/\/|\#|--|<!--)\s*([A-Z][A-Z0-9_:]*\s?)/g;

  for (const tagDefinition of allTags) {
    const decorationType = getDecorationTypeForTag(tagDefinition);
    const ranges: vscode.Range[] = [];

    // Create a specific regex for the current tag to find it within lines
    // Escape special characters in the tag for regex
    const escapedTag = tagDefinition.tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // This regex looks for common comment markers followed by the specific tag
    // It's a basic approach and might need refinement for different comment styles (block vs line)
    // and language specifics.
    const tagRegex = new RegExp(
      `(^\\s*(?:\\/\\/|#|--|<!--)\\s*)(${escapedTag})`,
      "gm"
    );

    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      const commentMarkerAndSpaceLength = match[1].length;
      // Start of the actual tag (e.g., "TODO:")
      const startPos = editor.document.positionAt(
        match.index + commentMarkerAndSpaceLength
      );
      // End of the actual tag
      const endPos = editor.document.positionAt(
        match.index + commentMarkerAndSpaceLength + match[2].length
      );

      // We want to decorate the tag itself, or the whole line starting from the tag.
      // For simplicity, let's decorate just the tag.
      // If you want to style the whole line, adjust the range.
      // Example: Decorate the line from the start of the tag to the end of the line.
      // const line = editor.document.lineAt(startPos.line);
      // const range = new vscode.Range(startPos, line.range.end);

      const range = new vscode.Range(startPos, endPos);
      ranges.push(range);
    }

    if (ranges.length > 0) {
      const existingRanges = decorationsMap.get(decorationType) || [];
      decorationsMap.set(decorationType, existingRanges.concat(ranges));
    } else {
      // Ensure the decoration type is at least set with an empty array if no ranges found for it
      // This helps in clearing previous decorations for this type if they existed.
      if (!decorationsMap.has(decorationType)) {
        decorationsMap.set(decorationType, []);
      }
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
  const mergedTags = getMergedTags(); // Use merged tags for snippets as well

  if (mergedTags.length === 0) {
    console.log("No custom tags found, skipping snippet generation");
    // Optionally, clear existing custom snippet files
    clearSnippetFiles(context);
    return;
    return;
  }

  console.log(`Generating snippets for ${mergedTags.length} tags`);

  // Generate snippets for different comment styles
  const generalSnippets = generateGeneralSnippets(mergedTags);
  const pythonSnippets = generatePythonSnippets(mergedTags);
  const htmlSnippets = generateHtmlSnippets(mergedTags);
}

function clearSnippetFiles(context: vscode.ExtensionContext) {
  const snippetsDir = path.join(context.extensionPath, "snippets");
  const generalPath = path.join(snippetsDir, "general-custom.code-snippets");
  const pythonPath = path.join(snippetsDir, "python-custom.code-snippets");
  const htmlPath = path.join(snippetsDir, "html-custom.code-snippets");

  if (fs.existsSync(generalPath)) fs.unlinkSync(generalPath);
  if (fs.existsSync(pythonPath)) fs.unlinkSync(pythonPath);
  if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  console.log("Cleared custom snippet files.");
}

/**
 * Generates snippets for general languages (C-style comments)
 */
function generateGeneralSnippets(
  customTags: CustomTag[]
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};
  const config = vscode.workspace.getConfiguration("betterCommentsEnhanced");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  customTags.forEach((tag) => {
    // Extract tag name without the colon
    const tagName = tag.tag.replace(":", "").toLowerCase().trim();
    if (!tagName || tagName === "/") return;

    // Create a friendly name for the snippet
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
      scope: "javascript,typescript,c,cpp,csharp,java",
      body: [`// ${tag.tag} ${emojiString} $1`],
      description: `Highlights ${tagName} comments`,
    };
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
  const config = vscode.workspace.getConfiguration("betterCommentsEnhanced");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  customTags.forEach((tag) => {
    const tagName = tag.tag.replace(":", "").toLowerCase().trim();
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
  const config = vscode.workspace.getConfiguration("betterCommentsEnhanced");
  const globalEmojiSetting = config.get<boolean>("useEmojis", true);

  customTags.forEach((tag) => {
    const tagName = tag.tag.replace(":", "").toLowerCase().trim();
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
 * Writes snippet data to a file in the snippets directory
 */
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
