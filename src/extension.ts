import * as vscode from "vscode";
import { TagEditorPanel } from "./tagEditor";
import * as fs from "fs";
import * as path from "path";

// The Better Comments tag configuration based on your settings
const enhancedCommentTags = [
  {
    tag: "//",
    color: "#6272a4",
    strikethrough: true,
    underline: false,
    backgroundColor: "transparent",
  },
  {
    tag: "EXPLANATION:",
    color: "#ff70b3",
    strikethrough: false,
    underline: false,
    backgroundColor: "transparent",
  },
  {
    tag: "TODO:",
    color: "#ffc66d",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "FIXME:",
    color: "#ff6e6e",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "BUG:",
    color: "#f8f8f2",
    strikethrough: false,
    backgroundColor: "#bb80ff",
  },
  {
    tag: "HACK:",
    color: "#ffffa5",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "NOTE:",
    color: "#94f0ff",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "INFO:",
    color: "#c798e6",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "IDEA:",
    color: "#80ffce",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "DEBUG:",
    color: "#ff2975",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "WHY:",
    color: "#ff9580",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "WHAT THIS DO:",
    color: "#FBBF24",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "CONTEXT:",
    color: "#d8ff80",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "CRITICAL:",
    color: "#FFFFFF",
    strikethrough: false,
    backgroundColor: "#9F1239",
  },
  {
    tag: "REVIEW:",
    color: "#A5B4FC",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "OPTIMIZE:",
    color: "#4ADE80",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "SECTION:",
    color: "#f1a18e",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "NEXT STEP:",
    color: "#ba6645",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "SECURITY:",
    color: "#cff028",
    strikethrough: false,
    backgroundColor: "#44475a",
  },
  {
    tag: "PERFORMANCE:",
    color: "#d7ffad",
    strikethrough: false,
    backgroundColor: "transparent",
  },
  {
    tag: "DEPRECATED:",
    color: "#8b8098",
    strikethrough: true,
    backgroundColor: "#44475a",
  },
  {
    tag: "API:",
    color: "#c798e6",
    strikethrough: false,
    backgroundColor: "transparent",
  },
];

export function activate(context: vscode.ExtensionContext) {
  console.log("Better Comments Enhanced is now active");
  console.log("Extension path:", context.extensionPath);
  console.log(
    "Available commands:",
    vscode.commands
      .getCommands(true)
      .then((commands) =>
        commands.filter((cmd) => cmd.includes("better-comments"))
      )
      .then((commands) => console.log("Filtered commands:", commands))
  );

  // Check if Better Comments is installed
  const betterCommentsExtension = vscode.extensions.getExtension(
    "aaron-bond.better-comments"
  );
  if (!betterCommentsExtension) {
    vscode.window.showErrorMessage(
      "Better Comments Enhanced requires the Better Comments extension. Please install it first."
    );
    return;
  }

  // Apply enhanced comment styles when extension activates
  applyEnhancedCommentStyles();

  // Generate snippets for custom tags
  updateCustomTagSnippets(context);

  // Register command to manually apply styles
  const applyStylesCommand = vscode.commands.registerCommand(
    "better-comments-enhanced.applyStyles",
    () => {
      applyEnhancedCommentStyles();
      // Generate snippets for custom tags
      updateCustomTagSnippets(context);
      vscode.window.showInformationMessage(
        "Enhanced comment styles applied successfully!"
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
        if (e.affectsConfiguration("betterCommentsEnhanced.customTags")) {
          applyEnhancedCommentStyles();
          updateCustomTagSnippets(context);
        }
      }
    )
  );
}

/**
 * Updates snippet files with custom tags
 */
function updateCustomTagSnippets(context: vscode.ExtensionContext) {
  // Get custom tags from configuration
  const config = vscode.workspace.getConfiguration("betterCommentsEnhanced");
  const rawCustomTags = config.get("customTags");
  const customTags = Array.isArray(rawCustomTags) ? rawCustomTags : [];

  if (customTags.length === 0) {
    console.log("No custom tags found, skipping snippet generation");
    return;
  }

  console.log(`Generating snippets for ${customTags.length} custom tags`);

  // Generate snippets for different comment styles
  const generalSnippets = generateGeneralSnippets(customTags);
  const pythonSnippets = generatePythonSnippets(customTags);
  const htmlSnippets = generateHtmlSnippets(customTags);

  // Write snippets to files
  writeSnippetsFile(context, "general-custom.code-snippets", generalSnippets);
  writeSnippetsFile(context, "python-custom.code-snippets", pythonSnippets);
  writeSnippetsFile(context, "html-custom.code-snippets", htmlSnippets);
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
 * Generates snippets for general languages (C-style comments)
 */
function generateGeneralSnippets(
  customTags: CustomTag[]
): Record<string, Snippet> {
  const snippets: Record<string, Snippet> = {};

  customTags.forEach((tag) => {
    // Extract tag name without the colon
    const tagName = tag.tag.replace(":", "").toLowerCase().trim();
    if (!tagName || tagName === "/") return;

    // Create a friendly name for the snippet
    const friendlyName = `${
      tagName.charAt(0).toUpperCase() + tagName.slice(1)
    } Comment`;

    // Select an appropriate emoji for the tag (you can customize this mapping)
    const emoji = getEmojiForTag(tagName);

    snippets[friendlyName] = {
      prefix: tagName,
      scope: "javascript,typescript,c,cpp,csharp,java",
      body: [`// ${tag.tag} ${emoji} $1`],
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

  customTags.forEach((tag) => {
    const tagName = tag.tag.replace(":", "").toLowerCase().trim();
    if (!tagName) return;

    const friendlyName = `${
      tagName.charAt(0).toUpperCase() + tagName.slice(1)
    } Comment`;
    const emoji = getEmojiForTag(tagName);

    snippets[friendlyName] = {
      prefix: tagName,
      scope: "python",
      body: [`# ${tag.tag} ${emoji} $1`],
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

  customTags.forEach((tag) => {
    const tagName = tag.tag.replace(":", "").toLowerCase().trim();
    if (!tagName) return;

    const friendlyName = `${
      tagName.charAt(0).toUpperCase() + tagName.slice(1)
    } Comment`;
    const emoji = getEmojiForTag(tagName);

    snippets[friendlyName] = {
      prefix: tagName,
      scope: "html,xml,svg",
      body: [`<!-- ${tag.tag} ${emoji} $1 -->`],
      description: `Highlights ${tagName} comments`,
    };
  });

  return snippets;
}

/**
 * Returns an appropriate emoji for a given tag type
 */
function getEmojiForTag(tagName: string): string {
  // Map of tag names to emojis
  const emojiMap: Record<string, string> = {
    todo: "📋",
    fixme: "🔧",
    bug: "🐛",
    hack: "⚡",
    note: "📝",
    idea: "💡",
    critical: "⚠️",
    optimize: "🚀",
    security: "🔒",
    deprecated: "⛔",
    review: "👁️",
    section: "📑",
    performance: "⏱️",
    api: "🔌",
    // Add more mappings as needed
  };

  return emojiMap[tagName] || "✨"; // Default emoji if no match
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
    fs.writeFileSync(filePath, JSON.stringify(snippets, null, 2), "utf8");
    console.log(`Snippets written to ${filePath}`);
  } catch (error: any) {
    console.error(`Error writing snippets file: ${error.message}`);
  }
}

function applyEnhancedCommentStyles() {
  const betterCommentsConfig =
    vscode.workspace.getConfiguration("better-comments");

  // Get custom tags from configuration
  const config = vscode.workspace.getConfiguration("betterCommentsEnhanced");
  const rawCustomTags = config.get("customTags");
  // Ensure customTags is always an array before spreading
  const customTags = Array.isArray(rawCustomTags) ? rawCustomTags : [];

  // Merge default enhanced tags with custom tags
  const mergedTags = [...enhancedCommentTags, ...customTags];

  betterCommentsConfig
    .update("tags", mergedTags, vscode.ConfigurationTarget.Global)
    .then(
      () => {
        console.log("Enhanced comment styles applied successfully");
      },
      (error) => {
        console.error("Error applying enhanced comment styles:", error);
        vscode.window.showErrorMessage(
          "Failed to apply enhanced comment styles. Check console for details."
        );
      }
    );
}

export function deactivate() {}
