// SECTION: 📑 Comment Decoration Management
// EXPLANATION: 💬 Handles VS Code text decorations for comment highlighting
// WHY: ❓ Centralizes decoration logic for better maintainability

import * as vscode from "vscode";
import { CustomTag, MultiLineCommentPattern, ExtensionState } from "../types";
import { getMergedTags } from "../config";
import { SINGLE_LINE_COMMENT_PREFIXES } from "../languages";

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

/**
 * WHAT_THIS_DO: 🤔 Creates or retrieves cached decoration type for a comment tag
 * WHY: ❓ Reuses decoration types for performance and memory efficiency
 * PERFORMANCE: ⏱️ Uses JSON-based caching to avoid recreating identical decorations
 * @param tag - CustomTag object defining visual styling properties
 * @param state - Extension state containing decoration cache
 * @returns VS Code TextEditorDecorationType for applying to text ranges
 */
export function getDecorationTypeForTag(
  tag: CustomTag,
  state: ExtensionState
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
  if (state.activeDecorationTypes.has(decorationKey)) {
    return state.activeDecorationTypes.get(decorationKey)!;
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
  };

  // ACCESSIBILITY: 🎯 Ensure theme compatibility with fallback colors
  if (!options.color && !options.backgroundColor) {
    // WHAT_THIS_DO: 🤔 Provide fallback color for better contrast
    options.color = new vscode.ThemeColor("editorCodeLens.foreground");
  }

  // WHAT_THIS_DO: 🤔 Create and cache new decoration type
  const decorationType = vscode.window.createTextEditorDecorationType(options);
  state.activeDecorationTypes.set(decorationKey, decorationType);
  
  return decorationType;
}

/**
 * WHAT_THIS_DO: 🤔 Analyzes document text and applies decorations to comment tags
 * WHY: ❓ Core functionality - provides visual highlighting for comment tags
 * PERFORMANCE: ⏱️ Optimized regex matching for both single and multi-line comments
 * @param editor - VS Code text editor to apply decorations to
 * @param state - Extension state for decoration management
 */
export function updateDecorationsForEditor(editor: vscode.TextEditor, state: ExtensionState): void {
  // SECURITY: 🔒 Validate editor and document existence
  if (!editor || !editor.document) return;

  const allTags = getMergedTags();
  
  // OPTIMIZE: 🚀 Early return if no tags to process
  if (allTags.length === 0) {
    // WHAT_THIS_DO: 🤔 Clear existing decorations when no tags are configured
    state.activeDecorationTypes.forEach((decorationType) => {
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
    const decorationType = getDecorationTypeForTag(tagDefinition, state);
    
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
  state.activeDecorationTypes.forEach((decorationType) => {
    editor.setDecorations(
      decorationType,
      decorationsMap.get(decorationType) || []
    );
  });
}

/**
 * WHAT_THIS_DO: 🤔 Triggers decoration updates with optional debouncing for performance
 * WHY: ❓ Prevents excessive decoration updates during rapid text changes
 * PERFORMANCE: ⏱️ Uses timeout-based debouncing to optimize rendering
 * @param editor - Text editor to update decorations for
 * @param state - Extension state for timeout management
 * @param immediate - Whether to skip debouncing and update immediately
 */
export function triggerUpdateDecorations(
  editor: vscode.TextEditor,
  state: ExtensionState,
  immediate: boolean = false
): void {
  // OPTIMIZE: 🚀 Clear existing timeout to reset debounce timer
  if (state.decorationTimeout) {
    clearTimeout(state.decorationTimeout);
    state.decorationTimeout = undefined;
  }
  
  if (immediate) {
    // PERFORMANCE: ⏱️ Immediate update for user-initiated actions
    updateDecorationsForEditor(editor, state);
  } else {
    // PERFORMANCE: ⏱️ Debounced update for text changes (500ms delay)
    state.decorationTimeout = setTimeout(
      () => updateDecorationsForEditor(editor, state),
      500
    );
  }
}

/**
 * WHAT_THIS_DO: 🤔 Clears all active decorations to prevent memory leaks
 * WHY: ❓ Essential for cleanup when configuration changes or extension deactivates
 * PERFORMANCE: ⏱️ Disposes decoration types and clears editor decorations
 * @param state - Extension state containing decoration cache
 */
export function clearAllDecorations(state: ExtensionState): void {
  // MEMORY: 🧠 Dispose all cached decoration types to free resources
  state.activeDecorationTypes.forEach((type) => type.dispose());
  state.activeDecorationTypes.clear();
  
  // NOTE: 📝 Individual editor decorations are cleared by updateDecorationsForEditor
  // CONTEXT: 🌐 VS Code handles editor-specific decoration cleanup automatically
}
