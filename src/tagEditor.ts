import * as vscode from "vscode";
import { UserDefinedLanguage, getUserDefinedLanguages } from "./extension";

// Utility function moved to module level
function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Retrieve better-comments tags for potential integration
function getBetterCommentTags() {
  const config = vscode.workspace.getConfiguration("better-comments");
  const tags = config.get("tags") || [];
  return tags;
}

interface CustomTagForEditor {
  tag: string;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  emoji?: string;
  useEmoji?: boolean;
}

export class TagEditorPanel {
  public static currentPanel: TagEditorPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (TagEditorPanel.currentPanel) {
      TagEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "tagEditor",
      "Comment Tag Editor",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
        ],
      }
    );

    TagEditorPanel.currentPanel = new TagEditorPanel(panel, extensionUri);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly _extensionUri: vscode.Uri
  ) {
    this._panel = panel;
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "saveTags":
            await this._saveTags(message.tags);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private async _saveTags(tags: any[]) {
    const config = vscode.workspace.getConfiguration("commentChameleon");
    await config.update("customTags", tags, vscode.ConfigurationTarget.Global);

    // Trigger tag update in main extension
    vscode.commands.executeCommand("commentChameleon.applyStyles");

    vscode.window
      .showInformationMessage(
        "Custom tags saved successfully! You must reload VS Code to use custom tag snippets.",
        "Reload Now"
      )
      .then((selection) => {
        if (selection === "Reload Now") {
          vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      });
  }

  private _update() {
    this._panel.title = "Comment Tag Editor";
    this._panel.webview.html = this._getWebviewContent();
  }

  private _getWebviewContent() {
    const config = vscode.workspace.getConfiguration("commentChameleon");
    const customTags: CustomTagForEditor[] = (config.get("customTags") ||
      []) as CustomTagForEditor[];
    const predefinedTags = [
      { tag: "//", color: "#6272a4" },
      { tag: "EXPLANATION:", color: "#ff70b3" },
      { tag: "TODO:", color: "#ffc66d" },
      { tag: "FIXME:", color: "#ff6e6e" },
      { tag: "BUG:", color: "#f8f8f2" },
      { tag: "HACK:", color: "#ffffa5" },
      { tag: "NOTE:", color: "#94f0ff" },
      { tag: "INFO:", color: "#c798e6" },
      { tag: "IDEA:", color: "#80ffce" },
      { tag: "DEBUG:", color: "#ff2975" },
      { tag: "WHY:", color: "#ff9580" },
      { tag: "WHAT THIS DO:", color: "#FBBF24" },
      { tag: "CONTEXT:", color: "#d8ff80" },
      { tag: "CRITICAL:", color: "#FFFFFF" },
      { tag: "REVIEW:", color: "#A5B4FC" },
      { tag: "OPTIMIZE:", color: "#4ADE80" },
      { tag: "SECTION:", color: "#f1a18e" },
      { tag: "NEXT STEP:", color: "#ba6645" },
      { tag: "SECURITY:", color: "#cff028" },
      { tag: "PERFORMANCE:", color: "#d7ffad" },
      { tag: "DEPRECATED:", color: "#8b8098" },
      { tag: "API:", color: "#c798e6" },
    ];

    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comment Chameleon Tag Editor</title>
        <style>
          :root {
            --bg-color: #2d2d2d;
            --text-color: #e0e0e0;
            --primary-color: #FF83A6;
            --accent-color: #6c5ce7;
            --border-color: #444444;
            --input-bg: #3a3a3a;
            --card-bg: #383838;
            --hover-bg: #4a4a4a;
          }
          
          body, html {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 16px;
            line-height: 1.5;
          }
          
          h1 {
            margin-top: 0;
            margin-bottom: 16px;
            font-weight: 500;
            color: var(--primary-color);
            font-size: 24px;
          }
          
          p {
            margin-bottom: 24px;
            opacity: 0.8;
          }
          
          .tag-container {
            background-color: var(--card-bg);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            border: 1px solid var(--border-color);
          }
          
          .tag-row {
            display: flex;
            flex-direction: column;
            margin-bottom: 12px;
          }
          
          .tag-row label {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 6px;
          }
          
          .tag-input, input[type="text"] {
            background-color: var(--input-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-color);
            padding: 8px 10px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            width: 100%;
          }
          
          .tag-input:focus, input[type="text"]:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(255, 131, 166, 0.2);
          }
          
          .color-picker {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }
          
          .color-swatch {
            width: 40px;
            height: 40px;
            border-radius: 4px;
            border: 1px solid var(--border-color);
            cursor: pointer;
            position: relative;
            transition: transform 0.1s;
          }
          
          .color-swatch:hover {
            transform: scale(1.05);
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
          }
          
          .color-swatch:after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, transparent 0%, transparent 45%, rgba(255,255,255,0.3) 50%, transparent 55%, transparent 100%);
            border-radius: inherit;
            pointer-events: none;
          }
          
          .opacity-slider {
            -webkit-appearance: none;
            height: 16px;
            border-radius: 8px;
            cursor: pointer;
            flex-grow: 1;
            margin: 0 8px;
          }
          
          .opacity-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
            cursor: pointer;
          }
          
          .color-display {
            display: flex;
            align-items: center;
            margin-top: 8px;
            background-color: var(--input-bg);
            border-radius: 4px;
            padding: 8px;
          }
          
          .color-value {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            color: var(--text-color);
            padding: 6px 8px;
            font-size: 14px;
            font-family: monospace;
            min-width: 80px;
            text-align: center;
          }
          
          .opacity-label {
            font-size: 14px;
            margin: 0 10px;
          }
          
          .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }
          
          .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
          }
          
          .checkbox-group input[type="checkbox"] {
            accent-color: var(--primary-color);
            width: 16px;
            height: 16px;
          }
          
          .tag-preview {
            background-color: var(--input-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 12px;
            margin-top: 12px;
            margin-bottom: 12px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-break: break-all;
          }
          
          button {
            background-color: var(--accent-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-right: 8px;
          }
          
          button:hover {
            background-color: #5849c2;
          }
          
          .remove-tag-btn {
            background-color: #e74c3c;
          }
          
          .remove-tag-btn:hover {
            background-color: #c0392b;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          
          th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid var(--border-color);
          }
          
          th {
            background-color: var(--accent-color);
            color: white;
          }
          
          tr:hover {
            background-color: var(--hover-bg);
          }
        </style>
      </head>
      <body>
        <h1>Comment Chameleon Tag Editor</h1>
        <p>Create and customize your comment tags with colors, formatting, and emojis.</p>
        
        <div id="tags-list"></div>
        
        <div style="margin-top: 20px;">
          <button id="add-tag">Add New Tag</button>
          <button id="save-tags">Save All Tags</button>
        </div>

        <h2>Predefined and Custom Tags</h2>
        <table>
          <thead>
            <tr>
              <th>Predefined Tags</th>
              <th>Custom Tags</th>
            </tr>
          </thead>
          <tbody>
            ${predefinedTags
              .map(
                (predefined, index) => `
                  <tr>
                    <td style="color: ${predefined.color}">${predefined.tag}</td>
                    <td style="color: ${customTags[index]?.color || "#000"}">${
                    customTags[index]?.tag || ""
                  }</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>

        <script nonce="${nonce}">
          (function() {
            const vscode = acquireVsCodeApi();
            let tags = ${JSON.stringify(customTags)};
            const tagsList = document.getElementById('tags-list');

            // Parse hex color with alpha to return separate RGB and alpha values
            function parseHexColor(hex) {
              if (!hex) return { rgb: '#000000', alpha: 1 };
              
              // Handle 'transparent' special case
              if (hex === 'transparent') return { rgb: '#000000', alpha: 0 };
              
              // Standard hex color (#RRGGBB)
              if (hex.length === 7) {
                return { rgb: hex, alpha: 1 };
              }
              
              // Hex with alpha (#RRGGBBAA)
              if (hex.length === 9) {
                const alpha = parseInt(hex.slice(7), 16) / 255;
                return { 
                  rgb: hex.slice(0, 7), 
                  alpha: alpha.toFixed(2)
                };
              }
              
              // Check if it's rgba format
              if (hex.startsWith('rgba(')) {
                const parts = hex.match(/rgba\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*([\\d.]+)\\s*\\)/);
                if (parts) {
                  const r = parseInt(parts[1]).toString(16).padStart(2, '0');
                  const g = parseInt(parts[2]).toString(16).padStart(2, '0');
                  const b = parseInt(parts[3]).toString(16).padStart(2, '0');
                  return {
                    rgb: \`#\${r}\${g}\${b}\`,
                    alpha: parseFloat(parts[4]).toFixed(2)
                  };
                }
              }
              
              // Fallback for unknown format
              return { rgb: hex, alpha: 1 };
            }

            // Convert hex color and alpha to rgba format
            function toRgba(hex, alpha) {
              if (!hex) return 'rgba(0, 0, 0, ' + alpha + ')';
              
              // Parse the hex color
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              
              return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
            }

            // Convert hex color and alpha to #RRGGBBAA format
            function toHexWithAlpha(hex, alpha) {
              if (!hex) return '#00000000';
              if (alpha == 0) return 'transparent';
              
              const alphaHex = Math.round(parseFloat(alpha) * 255).toString(16).padStart(2, '0');
              return \`\${hex}\${alphaHex}\`;
            }

            function renderTags() {
              tagsList.innerHTML = '';
              
              tags.forEach((tag, index) => {
                const tagEditor = document.createElement('div');
                tagEditor.className = 'tag-container';
                
                // Parse background color into components
                const textColor = parseHexColor(tag.color || '#FFFFFF');
                const bgColor = parseHexColor(tag.backgroundColor || 'transparent');
                
                tagEditor.innerHTML = \`
                  <div class="tag-row">
                    <label for="tag-\${index}">Tag Text:</label>
                    <input type="text" id="tag-\${index}" value="\${tag.tag || ''}" class="tag-input">
                  </div>
                  
                  <div class="tag-row">
                    <label>Text Color:</label>
                    <div class="color-display">
                      <div class="color-swatch" id="text-color-swatch-\${index}" style="background-color: \${tag.color || '#FFFFFF'}" title="Click to change color"></div>
                      <span class="opacity-label">Opacity:</span>
                      <input type="range" class="opacity-slider" id="text-color-alpha-\${index}" 
                             min="0" max="1" step="0.01" value="\${textColor.alpha}" 
                             style="background: linear-gradient(to right, transparent, \${textColor.rgb})">
                      <span class="color-value" id="text-color-value-\${index}">\${tag.color || '#FFFFFF'}</span>
                    </div>
                  </div>
                  
                  <div class="tag-row">
                    <label>Background Color:</label>
                    <div class="color-display">
                      <div class="color-swatch" id="bg-color-swatch-\${index}" style="background-color: \${tag.backgroundColor || 'transparent'}" title="Click to change color"></div>
                      <span class="opacity-label">Opacity:</span>
                      <input type="range" class="opacity-slider" id="bg-color-alpha-\${index}" 
                             min="0" max="1" step="0.01" value="\${bgColor.alpha}" 
                             style="background: linear-gradient(to right, transparent, \${bgColor.rgb})">
                      <span class="color-value" id="bg-color-value-\${index}">\${bgColor.rgb}</span>
                    </div>
                  </div>
                  
                  <div class="tag-row">
                    <label>Format:</label>
                    <div class="checkbox-group">
                      <label><input type="checkbox" id="bold-\${index}" \${tag.bold ? 'checked' : ''}> Bold</label>
                      <label><input type="checkbox" id="italic-\${index}" \${tag.italic ? 'checked' : ''}> Italic</label>
                      <label><input type="checkbox" id="underline-\${index}" \${tag.underline ? 'checked' : ''}> Underline</label>
                      <label><input type="checkbox" id="strikethrough-\${index}" \${tag.strikethrough ? 'checked' : ''}> Strikethrough</label>
                    </div>
                  </div>
                  
                  <div class="tag-row">
                    <label for="emoji-\${index}">Emoji:</label>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <input type="text" id="emoji-\${index}" value="\${tag.emoji || ''}" placeholder="e.g., 💡" maxlength="2" style="width: 60px">
                      <label><input type="checkbox" id="use-emoji-\${index}" \${tag.useEmoji !== false ? 'checked' : ''}> Use Emoji</label>
                    </div>
                  </div>
                  
                  <div class="tag-preview" id="preview-\${index}">
                    Preview will appear here
                  </div>
                  
                  <button class="remove-tag-btn" data-index="\${index}">Remove Tag</button>
                \`;
                
                tagsList.appendChild(tagEditor);
                
                // Initialize color pickers and add event listeners
                initializeColorPickers(index, tag);
                
                // Add other event listeners
                document.getElementById(\`tag-\${index}\`).addEventListener('input', function() {
                  tags[index].tag = this.value;
                  updatePreview(index);
                });
                
                document.getElementById(\`bold-\${index}\`).addEventListener('change', function() {
                  tags[index].bold = this.checked;
                  updatePreview(index);
                });
                
                document.getElementById(\`italic-\${index}\`).addEventListener('change', function() {
                  tags[index].italic = this.checked;
                  updatePreview(index);
                });
                
                document.getElementById(\`underline-\${index}\`).addEventListener('change', function() {
                  tags[index].underline = this.checked;
                  updatePreview(index);
                });
                
                document.getElementById(\`strikethrough-\${index}\`).addEventListener('change', function() {
                  tags[index].strikethrough = this.checked;
                  updatePreview(index);
                });
                
                document.getElementById(\`emoji-\${index}\`).addEventListener('input', function() {
                  tags[index].emoji = this.value;
                  updatePreview(index);
                });
                
                document.getElementById(\`use-emoji-\${index}\`).addEventListener('change', function() {
                  tags[index].useEmoji = this.checked;
                  updatePreview(index);
                });
                
                document.querySelector(\`[data-index="\${index}"]\`).addEventListener('click', function() {
                  tags.splice(index, 1);
                  renderTags();
                });
                
                // Initial preview
                updatePreview(index);
              });
            }
            
            function initializeColorPickers(index, tag) {
              // Text color initialization
              const textColorSwatch = document.getElementById(\`text-color-swatch-\${index}\`);
              const textColorValue = document.getElementById(\`text-color-value-\${index}\`);
              const textColorAlpha = document.getElementById(\`text-color-alpha-\${index}\`);
              
              // Background color initialization
              const bgColorSwatch = document.getElementById(\`bg-color-swatch-\${index}\`);
              const bgColorValue = document.getElementById(\`bg-color-value-\${index}\`);
              const bgColorAlpha = document.getElementById(\`bg-color-alpha-\${index}\`);
              
              // Color picker click handler to show color picker dialog
              textColorSwatch.addEventListener('click', function() {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = parseHexColor(tag.color || '#FFFFFF').rgb;
                input.addEventListener('input', function() {
                  const alpha = parseFloat(textColorAlpha.value);
                  tag.color = alpha < 1 ? toHexWithAlpha(this.value, alpha) : this.value;
                  textColorSwatch.style.backgroundColor = toRgba(this.value, alpha);
                  textColorValue.textContent = this.value;
                  textColorAlpha.style.background = \`linear-gradient(to right, transparent, \${this.value})\`;
                  updatePreview(index);
                });
                input.click();
              });
              
              bgColorSwatch.addEventListener('click', function() {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = parseHexColor(tag.backgroundColor || '#000000').rgb;
                input.addEventListener('input', function() {
                  const alpha = parseFloat(bgColorAlpha.value);
                  tag.backgroundColor = alpha < 1 ? toHexWithAlpha(this.value, alpha) : this.value;
                  bgColorSwatch.style.backgroundColor = toRgba(this.value, alpha);
                  bgColorValue.textContent = this.value;
                  bgColorAlpha.style.background = \`linear-gradient(to right, transparent, \${this.value})\`;
                  updatePreview(index);
                });
                input.click();
              });
              
              // Alpha slider for text color
              textColorAlpha.addEventListener('input', function() {
                const color = parseHexColor(tag.color || '#FFFFFF').rgb;
                const alpha = parseFloat(this.value);
                tag.color = alpha < 1 ? toHexWithAlpha(color, alpha) : color;
                textColorSwatch.style.backgroundColor = toRgba(color, alpha);
                updatePreview(index);
              });
              
              // Alpha slider for background color
              bgColorAlpha.addEventListener('input', function() {
                const color = parseHexColor(tag.backgroundColor || '#000000').rgb;
                const alpha = parseFloat(this.value);
                tag.backgroundColor = alpha === 0 ? 'transparent' : toHexWithAlpha(color, alpha);
                bgColorSwatch.style.backgroundColor = toRgba(color, alpha);
                updatePreview(index);
              });
            }
            
            // Update the preview for a specific tag
            function updatePreview(index) {
              const tag = tags[index];
              const preview = document.getElementById(\`preview-\${index}\`);
              
              // Prepare emoji if needed
              let emojiString = " 💡";
              if (tag.useEmoji !== false && tag.emoji) {
                emojiString = \` \${tag.emoji}\`;
              }
              
              preview.textContent = \`// \${tag.tag}\${emojiString} This is a preview of your comment tag\`;
              
              // Apply styling
              preview.style.color = tag.color || '';
              preview.style.backgroundColor = tag.backgroundColor || 'transparent';
              preview.style.fontWeight = tag.bold ? 'bold' : 'normal';
              preview.style.fontStyle = tag.italic ? 'italic' : 'normal';
              preview.style.textDecoration = '';
              
              if (tag.underline) {
                preview.style.textDecoration += 'underline ';
              }
              
              if (tag.strikethrough) {
                preview.style.textDecoration += 'line-through';
              }
            }

            // Add new tag button
            document.getElementById('add-tag').addEventListener('click', function() {
              tags.push({
                tag: 'NEW:',
                color: '#FFFFFF',
                backgroundColor: '#00000080', // 50% transparent black
                strikethrough: false,
                underline: false,
                bold: false,
                italic: false,
                emoji: '✨',
                useEmoji: true
              });
              renderTags();
            });
              
            // Save tags button
            document.getElementById('save-tags').addEventListener('click', function() {
              vscode.postMessage({
                command: 'saveTags',
                tags: tags
              });
            });
              
            // Initial render
            renderTags();
          })();
        </script>
      </body>
      </html>`;
  }

  public dispose() {
    TagEditorPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

export class LanguageEditorPanel {
  public static currentPanel: LanguageEditorPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (LanguageEditorPanel.currentPanel) {
      LanguageEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "languageEditor",
      "Language Editor",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
        ],
      }
    );

    LanguageEditorPanel.currentPanel = new LanguageEditorPanel(panel, extensionUri);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly _extensionUri: vscode.Uri
  ) {
    this._panel = panel;
    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "saveLanguage":
            await this._saveLanguage(message.language);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private async _saveLanguage(language: UserDefinedLanguage) {
    const config = vscode.workspace.getConfiguration("commentChameleon");
    const existingLanguages = getUserDefinedLanguages();
    existingLanguages.push(language);
    await config.update(
      "userDefinedLanguages",
      existingLanguages,
      vscode.ConfigurationTarget.Global
    );
    vscode.window.showInformationMessage("Language saved successfully!");
  }

  private _update() {
    this._panel.title = "Language Editor";
    this._panel.webview.html = this._getWebviewContent();
  }

  private _getWebviewContent(): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Language Editor</title>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          function saveLanguage() {
            const language = {
              languageName: document.getElementById('languageName').value,
              singleLinePrefix: document.getElementById('singleLinePrefix').value,
              multiLinePrefix: document.getElementById('multiLinePrefix').value,
              multiLineSuffix: document.getElementById('multiLineSuffix').value,
            };
            vscode.postMessage({ command: 'saveLanguage', language });
          }
        </script>
      </head>
      <body>
        <h1>Language Editor</h1>
        <form>
          <label for="languageName">Language Name:</label>
          <input type="text" id="languageName" name="languageName" required><br>
          <label for="singleLinePrefix">Single Line Prefix:</label>
          <input type="text" id="singleLinePrefix" name="singleLinePrefix" required><br>
          <label for="multiLinePrefix">Multi Line Prefix:</label>
          <input type="text" id="multiLinePrefix" name="multiLinePrefix" required><br>
          <label for="multiLineSuffix">Multi Line Suffix:</label>
          <input type="text" id="multiLineSuffix" name="multiLineSuffix" required><br>
          <button type="button" onclick="saveLanguage()">Save</button>
        </form>
      </body>
      </html>`;
  }

  public dispose() {
    LanguageEditorPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
