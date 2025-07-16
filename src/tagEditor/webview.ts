// SECTION: 📑 Tag Editor Webview Content Generator
// EXPLANATION: 💬 Generates HTML, CSS, and JavaScript content for the tag editor webview
// WHY: ❓ Separates UI generation logic from panel management for better maintainability

import { CustomTagForEditor } from "./types";
import { getNonce } from "./utils";

/**
 * WHAT_THIS_DO: 🤔 Generates the complete HTML content for the tag editor webview
 * WHY: ❓ Creates rich interactive interface for editing comment tags
 * PERFORMANCE: ⏱️ Generates content dynamically based on current tag configuration
 * @param customTags - Array of user-defined custom tags
 * @returns Complete HTML string for webview
 */
export function generateTagEditorHTML(customTags: CustomTagForEditor[]): string {
  const predefinedTags = getPredefinedTagsForDisplay();
  const nonce = getNonce();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comment Tag Editor</title>
  ${generateTagEditorCSS()}
</head>
<body>
  ${generateTagEditorBody(predefinedTags, customTags)}
  ${generateTagEditorJavaScript(nonce, customTags)}
</body>
</html>`;
}

/**
 * WHAT_THIS_DO: 🤔 Generates CSS styles for the tag editor interface
 * WHY: ❓ Provides modern, VS Code-themed styling for better user experience
 * ACCESSIBILITY: 🎯 Uses CSS custom properties for theme compatibility
 * @returns CSS style string for webview
 */
function generateTagEditorCSS(): string {
  return `
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
    padding: 0;
    line-height: 1.5;
  }
  
  h1, h2 {
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 500;
    color: var(--primary-color);
  }
  
  h1 { font-size: 24px; }
  h2 { font-size: 20px; }
  
  p {
    margin-bottom: 24px;
    opacity: 0.8;
  }
  
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 16px;
  }
  
  .tab {
    padding: 10px 20px;
    cursor: pointer;
    border: 1px solid var(--border-color);
    border-bottom: none;
    background-color: var(--card-bg);
    transition: background-color 0.2s;
  }
  
  .tab:hover {
    background-color: var(--hover-bg);
  }
  
  .tab.active {
    background-color: var(--bg-color);
    font-weight: 500;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  
  .tab-content {
    display: none;
    padding: 20px;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }
  
  .tab-content.active {
    display: block;
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
</style>`;
}

/**
 * WHAT_THIS_DO: 🤔 Generates the HTML body content for the tag editor
 * WHY: ❓ Creates the main interface structure with tabs and content areas
 * ACCESSIBILITY: 🎯 Uses semantic HTML and proper labeling
 * @param predefinedTags - Array of predefined tags for comparison
 * @param customTags - Array of user custom tags
 * @returns HTML body content string
 */
function generateTagEditorBody(predefinedTags: any[], customTags: CustomTagForEditor[]): string {
  return `
<div class="tabs">
  <div class="tab active" data-tab="custom-tags">Custom Tags</div>
  <div class="tab" data-tab="predefined-vs-custom">Predefined vs Custom Tags</div>
</div>
<div class="tab-content active" id="custom-tags">
  <h2>Custom Tags</h2>
  <p>Add or edit your custom tags here.</p>
  
  <div id="tags-list"></div>
  
  <div style="margin-top: 20px;">
    <button id="add-tag">Add New Tag</button>
    <button id="save-tags">Save All Tags</button>
  </div>
</div>
<div class="tab-content" id="predefined-vs-custom">
  <h2>Predefined vs Custom Tags</h2>
  <table>
    <thead>
      <tr>
        <th>Tag</th>
        <th>Type</th>
        <th>Background Color</th>
      </tr>
    </thead>
    <tbody>
      ${predefinedTags
        .map(
          (predefined) => `
            <tr>
              <td>
                <span style="background-color: ${predefined.backgroundColor || 'transparent'}; color: ${predefined.color || '#000'}; padding: 2px 4px; border-radius: 3px;">
                  ${predefined.emoji || ''} ${predefined.tag}
                </span>
              </td>
              <td>Predefined</td>
              <td>${predefined.backgroundColor || 'transparent'}</td>
            </tr>
          `
        )
        .join("")}
      ${customTags
        .map(
          (tag) => `
            <tr>
              <td>
                <span style="background-color: ${tag.backgroundColor || 'transparent'}; color: ${tag.color || '#000'}; padding: 2px 4px; border-radius: 3px;">
                  ${tag.emoji || ''} ${tag.tag}
                </span>
              </td>
              <td>Custom</td>
              <td>${tag.backgroundColor || 'transparent'}</td>
            </tr>
          `
        )
        .join("")}
    </tbody>
  </table>
</div>`;
}

/**
 * WHAT_THIS_DO: 🤔 Generates JavaScript code for tag editor functionality
 * WHY: ❓ Provides interactive behavior for the webview interface
 * SECURITY: 🔒 Uses nonce for Content Security Policy compliance
 * @param nonce - Security nonce for script execution
 * @param customTags - Initial custom tags data
 * @returns JavaScript code string for webview
 */
function generateTagEditorJavaScript(nonce: string, customTags: CustomTagForEditor[]): string {
  return `
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
<script nonce="${nonce}">
  document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        // Add active class to the clicked tab and corresponding content
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');
      });
    });
  });
</script>`;
}

/**
 * WHAT_THIS_DO: 🤔 Generates the complete HTML content for the language editor webview
 * WHY: ❓ Creates interface for managing language-specific comment syntax
 * ACCESSIBILITY: 🎯 Provides structured form for language configuration
 * @param betterCommentTags - Current better-comments language configuration
 * @returns Complete HTML string for language editor webview
 */
export function generateLanguageEditorHTML(betterCommentTags: any): string {
  const nonce = getNonce();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Language Configuration Editor</title>
  ${generateLanguageEditorCSS()}
</head>
<body>
  ${generateLanguageEditorBody(betterCommentTags)}
  ${generateLanguageEditorJavaScript(nonce, betterCommentTags)}
</body>
</html>`;
}

/**
 * WHAT_THIS_DO: 🤔 Generates CSS styles for the language editor interface
 * WHY: ❓ Provides consistent styling with tag editor for unified UX
 * @returns CSS style string for language editor
 */
function generateLanguageEditorCSS(): string {
  return `
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
    padding: 20px;
    line-height: 1.5;
  }
  
  h1, h2 {
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 500;
    color: var(--primary-color);
  }
  
  .language-container {
    background-color: var(--card-bg);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--border-color);
  }
  
  .language-row {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }
  
  label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
  }
  
  input[type="text"], textarea {
    background-color: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-color);
    padding: 8px 10px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  
  input[type="text"]:focus, textarea:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(255, 131, 166, 0.2);
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
</style>`;
}

/**
 * WHAT_THIS_DO: 🤔 Generates HTML body content for language editor
 * WHY: ❓ Creates form interface for editing language configurations
 * @param betterCommentTags - Current language configuration
 * @returns HTML body content string
 */
function generateLanguageEditorBody(betterCommentTags: any): string {
  return `
<h1>Language Configuration Editor</h1>
<p>Configure comment syntax for different programming languages.</p>

<div id="languages-list"></div>

<div style="margin-top: 20px;">
  <button id="add-language">Add Language</button>
  <button id="save-languages">Save Configuration</button>
</div>`;
}

/**
 * WHAT_THIS_DO: 🤔 Generates JavaScript for language editor functionality
 * WHY: ❓ Provides interactive behavior for language configuration
 * @param nonce - Security nonce for CSP compliance
 * @param betterCommentTags - Initial language configuration
 * @returns JavaScript code string
 */
function generateLanguageEditorJavaScript(nonce: string, betterCommentTags: any): string {
  return `
<script nonce="${nonce}">
  (function() {
    const vscode = acquireVsCodeApi();
    let languages = ${JSON.stringify(betterCommentTags || [])};
    const languagesList = document.getElementById('languages-list');

    function renderLanguages() {
      languagesList.innerHTML = '';
      
      languages.forEach((lang, index) => {
        const langEditor = document.createElement('div');
        langEditor.className = 'language-container';
        
        langEditor.innerHTML = \`
          <div class="language-row">
            <label for="lang-name-\${index}">Language:</label>
            <input type="text" id="lang-name-\${index}" value="\${lang.language || ''}" placeholder="e.g., javascript, python">
          </div>
          
          <div class="language-row">
            <label for="lang-delimiter-\${index}">Comment Delimiter:</label>
            <input type="text" id="lang-delimiter-\${index}" value="\${lang.delimiter || ''}" placeholder="e.g., //, #, /*">
          </div>
          
          <button class="remove-language-btn" data-index="\${index}">Remove Language</button>
        \`;
        
        languagesList.appendChild(langEditor);
        
        // Add event listeners
        document.getElementById(\`lang-name-\${index}\`).addEventListener('input', function() {
          languages[index].language = this.value;
        });
        
        document.getElementById(\`lang-delimiter-\${index}\`).addEventListener('input', function() {
          languages[index].delimiter = this.value;
        });
        
        document.querySelector(\`[data-index="\${index}"]\`).addEventListener('click', function() {
          languages.splice(index, 1);
          renderLanguages();
        });
      });
    }

    document.getElementById('add-language').addEventListener('click', function() {
      languages.push({
        language: '',
        delimiter: ''
      });
      renderLanguages();
    });
      
    document.getElementById('save-languages').addEventListener('click', function() {
      vscode.postMessage({
        command: 'saveLanguages',
        languages: languages
      });
    });
      
    renderLanguages();
  })();
</script>`;
}

/**
 * WHAT_THIS_DO: 🤔 Returns predefined tags for display in comparison view
 * WHY: ❓ Provides consistent predefined tag data for UI generation
 * CONTEXT: 🌐 Used in comparison view to show predefined vs custom tags
 * @returns Array of predefined tag objects
 */
function getPredefinedTagsForDisplay(): any[] {
  return [
    { tag: "//", color: "#6272a4", backgroundColor: "transparent", emoji: "" },
    { tag: "EXPLANATION:", color: "#ff70b3", backgroundColor: "transparent", emoji: "💬" },
    { tag: "TODO:", color: "#ffc66d", backgroundColor: "transparent", emoji: "📋" },
    { tag: "FIXME:", color: "#ff6e6e", backgroundColor: "transparent", emoji: "🔧" },
    { tag: "BUG:", color: "#f8f8f2", backgroundColor: "#bb80ff", emoji: "🐛" },
    { tag: "HACK:", color: "#ffffa5", backgroundColor: "transparent", emoji: "⚡" },
    { tag: "NOTE:", color: "#94f0ff", backgroundColor: "transparent", emoji: "📝" },
    { tag: "INFO:", color: "#c798e6", backgroundColor: "transparent", emoji: "ℹ️" },
    { tag: "IDEA:", color: "#80ffce", backgroundColor: "transparent", emoji: "💡" },
    { tag: "DEBUG:", color: "#ff2975", backgroundColor: "transparent", emoji: "🐞" },
    { tag: "WHY:", color: "#ff9580", backgroundColor: "transparent", emoji: "❓" },
    { tag: "WHAT_THIS_DO:", color: "#FBBF24", backgroundColor: "transparent", emoji: "🤔" },
    { tag: "CONTEXT:", color: "#d8ff80", backgroundColor: "transparent", emoji: "🌐" },
    { tag: "CRITICAL:", color: "#FFFFFF", backgroundColor: "#9F1239", emoji: "⚠️" },
    { tag: "REVIEW:", color: "#A5B4FC", backgroundColor: "transparent", emoji: "👁️" },
    { tag: "OPTIMIZE:", color: "#4ADE80", backgroundColor: "transparent", emoji: "🚀" },
    { tag: "SECTION:", color: "#f1a18e", backgroundColor: "transparent", emoji: "📑" },
    { tag: "NEXT STEP:", color: "#ba6645", backgroundColor: "transparent", emoji: "➡️" },
    { tag: "SECURITY:", color: "#cff028", backgroundColor: "#44475a", emoji: "🔒" },
    { tag: "PERFORMANCE:", color: "#d7ffad", backgroundColor: "transparent", emoji: "⏱️" },
    { tag: "DEPRECATED:", color: "#8b8098", backgroundColor: "#44475a", emoji: "⛔" },
    { tag: "API:", color: "#c798e6", backgroundColor: "transparent", emoji: "🔌" },
  ];
}
