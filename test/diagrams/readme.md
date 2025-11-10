### Diagrams Folder

This folder contains diagram files that can be displayed in the viewer.

#### Supported Formats

1. **Draw.io files (.drawio)** - Native draw.io format
2. **Visio files (.vsdx)** - Microsoft Visio 2013+ format

#### Adding Visio Files

To add Visio diagrams:
1. Place your .vsdx files in this folder
2. Update the tree structure in index13_v4.html to reference the new file
3. The viewer will automatically detect and display .vsdx files using draw.io's built-in Visio support

Example tree node for Visio file:
```json
{
    "text": "Организационная структура (Visio)",
    "id": "org-structure",
    "file": "org-structure.vsdx",
    "icon": "jstree-file"
}
```

#### SVG Export
файл 13
