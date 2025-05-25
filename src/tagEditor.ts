import * as vscode from "vscode";

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
    const config = vscode.workspace.getConfiguration("betterCommentsEnhanced");
    await config.update("customTags", tags, vscode.ConfigurationTarget.Global);

    // Trigger tag update in main extension
    vscode.commands.executeCommand("better-comments-enhanced.applyStyles");

    vscode.window.showInformationMessage("Custom tags saved successfully!");
  }

  private _update() {
    this._panel.title = "Comment Tag Editor";
    this._panel.webview.html = this._getWebviewContent();
  }

  private _getWebviewContent() {
    const config = vscode.workspace.getConfiguration("betterCommentsEnhanced");
    const customTags = config.get("customTags") || [];
    const defaultTags = JSON.stringify(getBetterCommentTags());

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comment Tag Editor</title>
      <style>
        body {
          padding: 20px;
          font-family: var(--vscode-font-family);
          color: var(--vscode-editor-foreground);
        }
        .tag-container {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid var(--vscode-panel-border);
          border-radius: 5px;
        }
        .tag-row {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .tag-row label {
          width: 120px;
        }
        input, select {
          padding: 5px;
          margin-right: 10px;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
        }
        button {
          padding: 8px 12px;
          margin-right: 10px;
          cursor: pointer;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 2px;
        }
        .color-preview {
          width: 20px;
          height: 20px;
          margin-left: 10px;
          border: 1px solid #ccc;
        }
        .tag-preview {
          margin-top: 10px;
          padding: 10px;
          border: 1px dashed var(--vscode-panel-border);
        }
        .checkbox-group {
          display: flex;
          gap: 10px;
        }
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 5px;
        }
      </style>
    </head>
    <body>
      <h1>Comment Tag Editor</h1>
      <p>Create and customize your comment tags below.</p>
      
      <div id="tags-list"></div>
      
      <div style="margin-top: 20px;">
        <button id="add-tag">Add New Tag</button>
        <button id="save-tags">Save All Tags</button>
      </div>

      <script>
        (function() {
          // Initialize with default and custom tags
          const defaultTags = ${defaultTags};
          let customTags = ${JSON.stringify(customTags)};
          const tagsList = document.getElementById('tags-list');
          
          // Function to render tags
          function renderTags() {
            tagsList.innerHTML = '';
            
            if (customTags.length === 0) {
              const message = document.createElement('p');
              message.textContent = 'No custom tags yet. Click "Add New Tag" to create one.';
              tagsList.appendChild(message);
              return;
            }
            
            customTags.forEach((tag, index) => {
              const container = document.createElement('div');
              container.className = 'tag-container';
              
              // Tag name
              const nameRow = document.createElement('div');
              nameRow.className = 'tag-row';
              const nameLabel = document.createElement('label');
              nameLabel.textContent = 'Tag Text:';
              const nameInput = document.createElement('input');
              nameInput.type = 'text';
              nameInput.value = tag.tag || '';
              nameInput.oninput = () => {
                customTags[index].tag = nameInput.value;
                updatePreview(index);
              };
              nameRow.appendChild(nameLabel);
              nameRow.appendChild(nameInput);
              container.appendChild(nameRow);
              
              // Color
              const colorRow = document.createElement('div');
              colorRow.className = 'tag-row';
              const colorLabel = document.createElement('label');
              colorLabel.textContent = 'Text Color:';
              const colorInput = document.createElement('input');
              colorInput.type = 'color';
              colorInput.value = tag.color || '#ffffff';
              colorInput.oninput = () => {
                customTags[index].color = colorInput.value;
                updatePreview(index);
              };
              const colorText = document.createElement('input');
              colorText.type = 'text';
              colorText.value = tag.color || '#ffffff';
              colorText.oninput = () => {
                colorInput.value = colorText.value;
                customTags[index].color = colorText.value;
                updatePreview(index);
              };
              colorRow.appendChild(colorLabel);
              colorRow.appendChild(colorInput);
              colorRow.appendChild(colorText);
              container.appendChild(colorRow);
              
              // Background color
              const bgColorRow = document.createElement('div');
              bgColorRow.className = 'tag-row';
              const bgColorLabel = document.createElement('label');
              bgColorLabel.textContent = 'Background:';
              const bgColorInput = document.createElement('input');
              bgColorInput.type = 'color';
              bgColorInput.value = tag.backgroundColor !== 'transparent' ? tag.backgroundColor : '#000000';
              const bgColorText = document.createElement('input');
              bgColorText.type = 'text';
              bgColorText.value = tag.backgroundColor || 'transparent';
              
              const transparentCheck = document.createElement('input');
              transparentCheck.type = 'checkbox';
              transparentCheck.id = \`transparent-\${index}\`;
              transparentCheck.checked = tag.backgroundColor === 'transparent';
              transparentCheck.onchange = () => {
                if (transparentCheck.checked) {
                  customTags[index].backgroundColor = 'transparent';
                  bgColorText.value = 'transparent';
                  bgColorText.disabled = true;
                  bgColorInput.disabled = true;
                } else {
                  customTags[index].backgroundColor = bgColorInput.value;
                  bgColorText.value = bgColorInput.value;
                  bgColorText.disabled = false;
                  bgColorInput.disabled = false;
                }
                updatePreview(index);
              };
              
              const transparentLabel = document.createElement('label');
              transparentLabel.htmlFor = \`transparent-\${index}\`;
              transparentLabel.textContent = 'Transparent';
              
              bgColorInput.oninput = () => {
                customTags[index].backgroundColor = bgColorInput.value;
                bgColorText.value = bgColorInput.value;
                updatePreview(index);
              };
              
              bgColorText.oninput = () => {
                if (bgColorText.value !== 'transparent') {
                  bgColorInput.value = bgColorText.value;
                  customTags[index].backgroundColor = bgColorText.value;
                  transparentCheck.checked = false;
                } else {
                  customTags[index].backgroundColor = 'transparent';
                  transparentCheck.checked = true;
                }
                updatePreview(index);
              };
              
              bgColorRow.appendChild(bgColorLabel);
              bgColorRow.appendChild(bgColorInput);
              bgColorRow.appendChild(bgColorText);
              bgColorRow.appendChild(transparentCheck);
              bgColorRow.appendChild(transparentLabel);
              container.appendChild(bgColorRow);
              
              // Text formatting options
              const formatRow = document.createElement('div');
              formatRow.className = 'tag-row';
              const formatLabel = document.createElement('label');
              formatLabel.textContent = 'Format:';
              
              const checkboxGroup = document.createElement('div');
              checkboxGroup.className = 'checkbox-group';
              
              // Bold option
              const boldLabel = document.createElement('label');
              const boldCheck = document.createElement('input');
              boldCheck.type = 'checkbox';
              boldCheck.checked = tag.bold || false;
              boldCheck.onchange = () => {
                customTags[index].bold = boldCheck.checked;
                updatePreview(index);
              };
              boldLabel.appendChild(boldCheck);
              boldLabel.appendChild(document.createTextNode('Bold'));
              checkboxGroup.appendChild(boldLabel);
              
              // Italic option
              const italicLabel = document.createElement('label');
              const italicCheck = document.createElement('input');
              italicCheck.type = 'checkbox';
              italicCheck.checked = tag.italic || false;
              italicCheck.onchange = () => {
                customTags[index].italic = italicCheck.checked;
                updatePreview(index);
              };
              italicLabel.appendChild(italicCheck);
              italicLabel.appendChild(document.createTextNode('Italic'));
              checkboxGroup.appendChild(italicLabel);
              
              // Underline option
              const underlineLabel = document.createElement('label');
              const underlineCheck = document.createElement('input');
              underlineCheck.type = 'checkbox';
              underlineCheck.checked = tag.underline || false;
              underlineCheck.onchange = () => {
                customTags[index].underline = underlineCheck.checked;
                updatePreview(index);
              };
              underlineLabel.appendChild(underlineCheck);
              underlineLabel.appendChild(document.createTextNode('Underline'));
              checkboxGroup.appendChild(underlineLabel);
              
              // Strikethrough option
              const strikeLabel = document.createElement('label');
              const strikeCheck = document.createElement('input');
              strikeCheck.type = 'checkbox';
              strikeCheck.checked = tag.strikethrough || false;
              strikeCheck.onchange = () => {
                customTags[index].strikethrough = strikeCheck.checked;
                updatePreview(index);
              };
              strikeLabel.appendChild(strikeCheck);
              strikeLabel.appendChild(document.createTextNode('Strikethrough'));
              checkboxGroup.appendChild(strikeLabel);
              
              formatRow.appendChild(formatLabel);
              formatRow.appendChild(checkboxGroup);
              container.appendChild(formatRow);
              
              // Preview
              const previewContainer = document.createElement('div');
              previewContainer.className = 'tag-preview';
              previewContainer.id = \`preview-\${index}\`;
              container.appendChild(previewContainer);
              
              // Delete button
              const buttonRow = document.createElement('div');
              buttonRow.style.marginTop = '10px';
              const deleteBtn = document.createElement('button');
              deleteBtn.textContent = 'Delete Tag';
              deleteBtn.onclick = () => {
                customTags.splice(index, 1);
                renderTags();
              };
              buttonRow.appendChild(deleteBtn);
              container.appendChild(buttonRow);
              
              tagsList.appendChild(container);
              
              // Initial preview update
              updatePreview(index);
            });
          }
          
          // Update the preview for a specific tag
          function updatePreview(index) {
            const tag = customTags[index];
            const preview = document.getElementById(\`preview-\${index}\`);
            
            preview.textContent = \`// \${tag.tag} This is a preview of your comment tag\`;
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
          document.getElementById('add-tag').addEventListener('click', () => {
            customTags.push({
              tag: 'NEW_TAG:',
              color: '#ffffff',
              backgroundColor: 'transparent',
              strikethrough: false,
              underline: false,
              bold: false,
              italic: false
            });
            renderTags();
          });
          
          // Save tags button
          document.getElementById('save-tags').addEventListener('click', () => {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
              command: 'saveTags',
              tags: customTags
            });
          });
          
          // Initial render
          renderTags();
        })();
        
        function getBetterCommentTags() {
          return ${defaultTags};
        }
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

function getBetterCommentTags() {
  // Return the default tags from the extension
  const config = vscode.workspace.getConfiguration("better-comments");
  const tags = config.get("tags") || [];
  return tags;
}
