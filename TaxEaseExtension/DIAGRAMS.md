# TaxEase Extension - Component Flow Diagram

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser Window                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      Tax Filing Website                        │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │            Content Script Injection Layer               │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐   │  │  │
│  │  │  │         #taxease-chat-root (Root Container)      │   │  │  │
│  │  │  │                                                   │   │  │  │
│  │  │  │  ┌────────────────────────────────────────────┐  │   │  │  │
│  │  │  │  │        React Application Layer            │  │   │  │  │
│  │  │  │  │                                            │  │   │  │  │
│  │  │  │  │  ┌──────────────────────────────────┐     │  │   │  │  │
│  │  │  │  │  │      ChatOverlay.jsx             │     │  │   │  │  │
│  │  │  │  │  │  ┌────────────────────────────┐  │     │  │   │  │  │
│  │  │  │  │  │  │  State Management         │  │     │  │   │  │  │
│  │  │  │  │  │  │  - isOpen                 │  │     │  │   │  │  │
│  │  │  │  │  │  │  - isMinimized            │  │     │  │   │  │  │
│  │  │  │  │  │  │  - messages[]             │  │     │  │   │  │  │
│  │  │  │  │  │  │  - position {x, y}        │  │     │  │   │  │  │
│  │  │  │  │  │  │  - size {width, height}   │  │     │  │   │  │  │
│  │  │  │  │  │  │  - darkMode               │  │     │  │   │  │  │
│  │  │  │  │  │  └────────────────────────────┘  │     │  │   │  │  │
│  │  │  │  │  │                                   │     │  │   │  │  │
│  │  │  │  │  │  ┌─────────────────────────────┐ │     │  │   │  │  │
│  │  │  │  │  │  │  When isOpen = false:       │ │     │  │   │  │  │
│  │  │  │  │  │  │                             │ │     │  │   │  │  │
│  │  │  │  │  │  │  AssistantButton.jsx        │ │     │  │   │  │  │
│  │  │  │  │  │  │  ┌──────────────────────┐   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │   💬 Floating Button │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │   - Pulse animation  │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │   - Badge count      │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │   - onClick handler  │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  └──────────────────────┘   │ │     │  │   │  │  │
│  │  │  │  │  │  └─────────────────────────────┘ │     │  │   │  │  │
│  │  │  │  │  │                                   │     │  │   │  │  │
│  │  │  │  │  │  ┌─────────────────────────────┐ │     │  │   │  │  │
│  │  │  │  │  │  │  When isOpen = true:        │ │     │  │   │  │  │
│  │  │  │  │  │  │                             │ │     │  │   │  │  │
│  │  │  │  │  │  │  DraggableWrapper.jsx       │ │     │  │   │  │  │
│  │  │  │  │  │  │  ┌──────────────────────┐   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ 📏 Drag & Resize     │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ - Bounds checking    │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ - 8 resize handles   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ - Position tracking  │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  └──────────────────────┘   │ │     │  │   │  │  │
│  │  │  │  │  │  │          │                  │ │     │  │   │  │  │
│  │  │  │  │  │  │          ▼                  │ │     │  │   │  │  │
│  │  │  │  │  │  │  ┌──────────────────────┐   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ 💬 Chat Window       │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │                      │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ ┌────────────────┐   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ Header         │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ .drag-handle   │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ [🇮🇳] TaxEase  │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ [🌙][🔽][✕]    │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ └────────────────┘   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │                      │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ ┌────────────────┐   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ Messages       │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ (Scrollable)   │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │                │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ ChatBubble ─── │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ ChatBubble ─── │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ ChatBubble ─── │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ ...            │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ └────────────────┘   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │                      │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ ┌────────────────┐   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ Controls       │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ [Upload] [Clear]│  │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ │ [Input] [Send] │   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │ └────────────────┘   │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  │                      │   │ │     │  │   │  │  │
│  │  │  │  │  │  │  └──────────────────────┘   │ │     │  │   │  │  │
│  │  │  │  │  │  └─────────────────────────────┘ │     │  │   │  │  │
│  │  │  │  │  └──────────────────────────────────┘     │  │   │  │  │
│  │  │  │  └────────────────────────────────────────────┘  │   │  │  │
│  │  │  └──────────────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Data Flow Diagram                             │
└──────────────────────────────────────────────────────────────────────┘

User Action
    │
    ▼
┌─────────────────────┐
│  ChatOverlay.jsx    │
│  (Event Handler)    │
└──────────┬──────────┘
           │
           ├──────────────────────────────────────┐
           │                                      │
           ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│  Local State Update │              │  Storage Service    │
│  - setMessages()    │              │  - saveMessages()   │
│  - setPosition()    │              │  - savePosition()   │
│  - setSize()        │              │  - saveIsOpen()     │
└──────────┬──────────┘              └──────────┬──────────┘
           │                                    │
           │                                    ▼
           │                         ┌─────────────────────┐
           │                         │ chrome.storage.local│
           │                         │    or               │
           │                         │ localStorage        │
           │                         └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Socket.io Client   │
│  - emit('message')  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backend Server     │
│  (AI Processing)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Socket.io Event    │
│  - on('ai-response')│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ChatOverlay.jsx    │
│  - Add AI message   │
│  - Update UI        │
└─────────────────────┘
```

## 🗂️ Component Hierarchy

```
ChatOverlay.jsx (Root Component)
│
├─ isOpen === false
│  └─ AssistantButton.jsx
│     ├─ Pulse animation
│     ├─ Unread badge
│     └─ onClick → setIsOpen(true)
│
└─ isOpen === true
   └─ DraggableWrapper.jsx
      ├─ Props:
      │  ├─ position {x, y}
      │  ├─ size {width, height}
      │  ├─ isMinimized
      │  └─ Callbacks
      │
      ├─ Resize Handles (8)
      │  ├─ Corner handles (4)
      │  └─ Edge handles (4)
      │
      └─ Chat Window
         ├─ Header (.drag-handle)
         │  ├─ Icon + Title
         │  ├─ Status badge
         │  ├─ Dark mode toggle
         │  ├─ Minimize button
         │  └─ Close button
         │
         ├─ Messages Area (if !isMinimized)
         │  ├─ ChatBubble[] (map messages)
         │  ├─ Typing indicator
         │  └─ Auto-scroll ref
         │
         └─ Controls (if !isMinimized)
            ├─ File upload
            ├─ Clear/End session
            ├─ Input field
            └─ Send button
```

## 🔌 Service Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                               │
└─────────────────────────────────────────────────────────────────┘

storageService.js
├─ Detection: chrome.storage vs localStorage
├─ Methods:
│  ├─ save(key, value) → Promise
│  ├─ get(key, default) → Promise<value>
│  ├─ remove(key) → Promise
│  └─ clearAll() → Promise
│
└─ Convenience Methods:
   ├─ saveOverlayPosition(position)
   ├─ getOverlayPosition(default)
   ├─ saveOverlaySize(size)
   ├─ getOverlaySize(default)
   ├─ saveMessages(messages[])
   ├─ getMessages(default[])
   ├─ saveIsOpen(boolean)
   ├─ getIsOpen(default)
   ├─ saveDarkMode(boolean)
   └─ getDarkMode(default)

AIService.js (existing)
├─ sendMessage(text)
├─ uploadFile(file)
└─ getResponse() → Promise

FormScanner.js (existing)
├─ detectFields()
├─ extractData()
└─ fillForm(data)
```

## 🎬 Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Component Lifecycle                           │
└─────────────────────────────────────────────────────────────────┘

1. Page Load
   ↓
2. contentScript.js executes
   ↓
3. Create #taxease-chat-root container
   ↓
4. Import overlay/index.js
   ↓
5. Render ChatOverlay.jsx
   ↓
6. useEffect (on mount):
   ├─ Load saved state from storage
   │  ├─ position
   │  ├─ size
   │  ├─ isOpen
   │  ├─ isMinimized
   │  ├─ darkMode
   │  └─ messages
   ├─ Initialize Socket.io connection
   └─ Set up event listeners
   ↓
7. Render UI:
   ├─ if (!isOpen) → Show AssistantButton
   └─ if (isOpen) → Show DraggableWrapper + Chat Window
   ↓
8. User Interactions:
   ├─ Drag → Update position → Save to storage
   ├─ Resize → Update size → Save to storage
   ├─ Send message → Update messages → Save to storage
   ├─ Toggle dark mode → Update darkMode → Save to storage
   └─ Close → Update isOpen → Save to storage
   ↓
9. Page Navigation (SPA):
   ├─ MutationObserver detects URL change
   ├─ Overlay persists (no re-mount)
   └─ State remains intact
   ↓
10. Page Reload:
    ├─ Steps 1-7 repeat
    └─ Saved state restored from storage
```

## 📱 Responsive Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│                   Responsive Features                           │
└─────────────────────────────────────────────────────────────────┘

Viewport Changes:
├─ Window Resize
│  ├─ Keep overlay within bounds
│  ├─ Adjust position if out of viewport
│  └─ Maintain current size
│
├─ Small Screens (<768px)
│  ├─ Auto-adjust to max available width
│  └─ Position at bottom-center
│
└─ Large Screens (>1920px)
   ├─ Allow full resizing
   └─ Default position: bottom-right

Drag Bounds:
├─ minX = 0
├─ maxX = window.innerWidth - overlay.width
├─ minY = 0
└─ maxY = window.innerHeight - overlay.height

Resize Constraints:
├─ minWidth = 350px
├─ maxWidth = 800px
├─ minHeight = 400px
└─ maxHeight = 800px
```

## 🎨 Theme System

```
┌─────────────────────────────────────────────────────────────────┐
│                      Theme Structure                            │
└─────────────────────────────────────────────────────────────────┘

Dark Mode (darkMode = true)
├─ Background: #1f2937 (gray-800)
├─ Header: linear-gradient(#374151, #1f2937)
├─ Text: white
├─ Messages Area: linear-gradient(#111827, #1f2937)
├─ Input: #1f2937 (gray-800)
└─ Scrollbar: rgba(75, 85, 99, 0.5)

Light Mode (darkMode = false)
├─ Background: #ffffff
├─ Header: linear-gradient(#667eea, #764ba2)
├─ Text: #111827 (gray-900)
├─ Messages Area: linear-gradient(#f9fafb, #f3f4f6)
├─ Input: white
└─ Scrollbar: linear-gradient(#667eea, #764ba2)

Shared Elements:
├─ Gradient buttons
├─ Smooth transitions
├─ Consistent spacing
└─ Neumorphic shadows
```

---

**This diagram provides a complete visual understanding of the TaxEase Extension architecture.**
