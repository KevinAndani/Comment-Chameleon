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
