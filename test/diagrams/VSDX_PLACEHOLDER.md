# Visio File Placeholder

This is a placeholder to indicate where Visio (.vsdx) files should be placed.

## How to Add Visio Files

1. **Download or Create a Visio File**
   - You can download sample organizational charts from:
     - [Microsoft Download Center](https://www.microsoft.com/en-us/download/details.aspx?id=26518)
     - [HowToAnalyzeData Sample Files](https://www.howtoanalyzedata.net/download-microsoft-visio-sample-diagram-files-vsdx-visio-files/)
   - Or create your own in Microsoft Visio

2. **Add the File to This Folder**
   - Save your .vsdx file as `org-structure.vsdx` (or update the filename in index13_v4.html)

3. **Publish to GitHub Pages**
   - Commit and push the .vsdx file to the repository
   - GitHub Pages will serve it at: `https://[username].github.io/[repo]/test/diagrams/[filename].vsdx`

4. **Test the Viewer**
   - Open index13_v4.html in your browser
   - Select the "Организационная структура (Visio)" node in the tree
   - The Visio diagram will be displayed using draw.io's viewer

## Supported Formats

- `.vsdx` - Microsoft Visio 2013 and later
- `.vsd` - Older Visio formats (may have limited support)

## Note

The viewer uses draw.io (diagrams.net) which has built-in support for importing and displaying Visio files. No additional plugins or libraries are required.
