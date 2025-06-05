import * as vscode from "vscode";

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

function getBetterCommentTags() {
  // Return the default tags from the extension
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
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comment Chameleon Tag Editor</title>
      <style>
        /* Existing styles... */
        
        /* New styles for color with alpha */
        .color-with-alpha {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .color-with-alpha input[type="color"] {
          min-width: 60px;
        }
        .color-preview {
          width: 30px;
          height: 30px;
          border: 1px solid var(--vscode-panel-border);
          border-radius: 3px;
        }
        .alpha-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .alpha-container input[type="range"] {
          flex-grow: 1;
        }
        .alpha-value {
          min-width: 40px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>Comment Chameleon Tag Editor</h1>
      <p>Create and customize your comment tags. Background colors can include transparency.</p>
      
      <div id="tags-list"></div>
      
      <div style="margin-top: 20px;">
        <button id="add-tag">Add New Tag</button>
        <button id="save-tags">Save All Tags</button>
      </div>

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
              const bgColor = parseHexColor(tag.backgroundColor || 'transparent');
              
              tagEditor.innerHTML = \`
                <div class="tag-row">
                  <label for="tag-\${index}">Tag Text:</label>
                  <input type="text" id="tag-\${index}" value="\${tag.tag || ''}" class="tag-input">
                </div>
                
                <div class="tag-row">
                  <label for="color-\${index}">Text Color:</label>
                  <input type="color" id="color-\${index}" value="\${tag.color || '#FFFFFF'}">
                </div>
                
                <div class="tag-row">
                  <label for="bg-color-\${index}">Background:</label>
                  <div class="color-with-alpha">
                    <input type="color" id="bg-color-\${index}" value="\${bgColor.rgb}">
                    <div class="color-preview" id="bg-preview-\${index}" style="background-color: \${tag.backgroundColor || 'transparent'};"></div>
                  </div>
                </div>
                
                <div class="tag-row">
                  <label>Transparency:</label>
                  <div class="alpha-container">
                    <input type="range" id="bg-alpha-\${index}" min="0" max="1" step="0.01" value="\${bgColor.alpha}">
                    <span class="alpha-value" id="alpha-value-\${index}">\${bgColor.alpha}</span>
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
                  <input type="text" id="emoji-\${index}" value="\${tag.emoji || ''}" placeholder="e.g., 💡" maxlength="2">
                  <label><input type="checkbox" id="use-emoji-\${index}" \${tag.useEmoji !== false ? 'checked' : ''}> Use Emoji</label>
                </div>
                
                <div class="tag-preview" id="preview-\${index}">
                  Preview will appear here
                </div>
                
                <button class="remove-tag-btn" data-index="\${index}">Remove Tag</button>
              \`;
              
              tagsList.appendChild(tagEditor);
              
              // Add event listeners
              document.getElementById(\`tag-\${index}\`).addEventListener('input', function() {
                tags[index].tag = this.value;
                updatePreview(index);
              });
              
              document.getElementById(\`color-\${index}\`).addEventListener('input', function() {
                tags[index].color = this.value;
                updatePreview(index);
              });
              
              const bgColorPicker = document.getElementById(\`bg-color-\${index}\`);
              const bgAlphaSlider = document.getElementById(\`bg-alpha-\${index}\`);
              const bgColorPreview = document.getElementById(\`bg-preview-\${index}\`);
              const alphaValueDisplay = document.getElementById(\`alpha-value-\${index}\`);
              
              function updateBackgroundColor() {
                const hexColor = bgColorPicker.value;
                const alpha = parseFloat(bgAlphaSlider.value);
                
                // Update preview
                const rgba = toRgba(hexColor, alpha);
                bgColorPreview.style.backgroundColor = rgba;
                
                // Update alpha display
                alphaValueDisplay.textContent = alpha.toFixed(2);
                
                // Update tag object with RGBA or hex+alpha
                tags[index].backgroundColor = alpha === 0 ? 'transparent' : toHexWithAlpha(hexColor, alpha);
                updatePreview(index);
              }
              
              bgColorPicker.addEventListener('input', updateBackgroundColor);
              bgAlphaSlider.addEventListener('input', updateBackgroundColor);
              
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
          
          // Update the preview for a specific tag
          function updatePreview(index) {
            const tag = tags[index];
            const preview = document.getElementById(\`preview-\${index}\`);
            
            // Prepare emoji if needed
            let emojiString = "";
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
              data: tags
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
