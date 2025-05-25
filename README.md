# Better Comments Enhanced

Enhances the popular Better Comments extension with emoji-based comment tags and snippets.

## Features

- Automatically applies styled comment tags for various categories (TODO, FIXME, BUG, etc.)
- Includes snippets for quick insertion of formatted comments
- Works with JavaScript, TypeScript, Python, HTML, and more
- **NEW**: Custom tag creation and styling
- **NEW**: Formatting options like bold, italic, underline, and strikethrough

## Requirements

This extension requires the [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments) extension.

## Usage

### Comment Tags

Type any of these snippets followed by Tab:

- `critical` - Creates a critical warning comment
- `todo` - Creates a todo comment
- `fixme` - Creates a fixme comment
- `bug` - Creates a bug comment
- ... and many more!

### Custom Tags

You can now create and customize your own tags:

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)
2. Select "Edit Custom Comment Tags"
3. Add and customize your tags with:
   - Custom text
   - Text color
   - Background color
   - Bold, italic, underline, and strikethrough formatting

## Comment Types

| Type                           | Description               |
| ------------------------------ | ------------------------- |
| `CRITICAL: ⚠️`                 | Critical sections of code |
| `TODO: 📋`                     | Todo items                |
| `FIXME: 🔧`                    | Things that need fixing   |
| `BUG: 🐛`                      | Known bugs                |
| `HACK: ⚡`                     | Hacky solutions           |
| `NOTE: 📝`                     | Important notes           |
| ... plus your own custom tags! | ...                       |

## Extension Settings

If you need to manually apply the enhanced styles, use the command:
`Better Comments Enhanced: Apply Enhanced Comment Styles`

To edit your custom tags:
`Better Comments Enhanced: Edit Custom Comment Tags`

## Emoji Support

Better Comment Tags supports emojis for visual distinction in comments:

### Default Emojis

Each built-in tag comes with a default emoji like:

- TODO: 📋
- FIXME: 🔧
- BUG: 🐛

### Customizing Emojis

When creating or editing custom tags, you can:

1. Use the emoji field to set a custom emoji
2. Toggle the "Use emoji" checkbox to enable/disable emoji for that tag
3. Leave the emoji field empty to use the default mapping

### Global Emoji Setting

You can globally enable or disable emojis in Settings:
`betterCommentsEnhanced.useEmojis`: true/false

### Using Snippets

When typing a tag name (e.g., "todo"), the snippet will automatically include the appropriate emoji if enabled.
