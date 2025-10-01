# kkPortfolio

2020. kkPortfolio powers the [live musician portfolio site](http://konskar.free.fr).

- Vanilla JS (ES5) with Bootstrap 4
- Modular design using Universal Module Definition (UMD)
- State and lifecycle management for robust module handling
- Progressive enhancement via feature detection
- Configurable UI templates separating presentation from logic
- Browser history support

## `index.js`

- Main entry point coordinating modules and dialogs
- Dynamic loading of modules and their dependencies

## `audio_player.js`

- Audio Player with playback controls, track selection/navigation, and dynamic HTML playlist
- MediaSession API integration for metadata and external media controls
- Keyboard shortcuts for controls

## `pdf_viewer.js`

- PDF Viewer with page navigation, zoom, print, and download controls
- PDF.js integration for rendering, metadata, and link handling
- Keyboard shortcuts for controls

## `file_browser.js`

- File Browser with folder tree, breadcrumbs, and prev/next navigation
- JSON or Apache auto-index HTML directory data support
- File viewer for code, text, images, audio, video, PDF, links, and binary downloads
- Source code viewer with syntax highlighting
- [PDF Viewer](#pdf_viewerjs) integration

## `bookmarks.js`

- Chromium-bookmarks file viewer with search and filtering
- External search engine integration

## `chat.js`

- One-to-one peer-to-peer chat with name/message input and start/stop session controls
- WebRTC DataChannel with SSE signaling
- Outgoing messages queue until connection established
- QR-based session sharing and connection notifications
- Automatic session restart and reconnection handling
- Multi-language interface and user identification via URL parameters
- Minimal PWA manifest injection for standalone display

## `index.css`

- Minimal, targeted Bootstrap customizations
