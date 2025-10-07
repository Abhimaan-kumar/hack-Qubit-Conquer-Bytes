import React, { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';

/**
 * DraggableWrapper Component
 * Provides draggable and resizable functionality for the chat overlay
 */
const DraggableWrapper = ({ 
  children, 
  position, 
  onPositionChange,
  size,
  onSizeChange,
  isMinimized,
  isDraggingState,
  onDraggingChange,
}) => {
  const nodeRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Handle drag
  const handleDrag = (e, data) => {
    // Update position during drag
    onPositionChange({ x: data.x, y: data.y });
  };

  const handleStart = () => {
    onDraggingChange(true);
  };

  const handleStop = (e, data) => {
    onDraggingChange(false);
    // Save final position
    onPositionChange({ x: data.x, y: data.y });
  };

  // Resize handlers
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setStartSize({ width: size.width, height: size.height });
    setStartPos({ x: e.clientX, y: e.clientY });
    onDraggingChange(true);
  };

  const handleResizeMove = (e) => {
    if (!isResizing || !resizeDirection) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    let newWidth = startSize.width;
    let newHeight = startSize.height;
    let newX = position.x;
    let newY = position.y;

    // Calculate new size based on direction
    switch (resizeDirection) {
      case 'se': // Southeast (bottom-right)
        newWidth = Math.max(350, Math.min(800, startSize.width + deltaX));
        newHeight = Math.max(400, Math.min(800, startSize.height + deltaY));
        break;
      case 'sw': // Southwest (bottom-left)
        newWidth = Math.max(350, Math.min(800, startSize.width - deltaX));
        newHeight = Math.max(400, Math.min(800, startSize.height + deltaY));
        newX = position.x + (startSize.width - newWidth);
        break;
      case 'ne': // Northeast (top-right)
        newWidth = Math.max(350, Math.min(800, startSize.width + deltaX));
        newHeight = Math.max(400, Math.min(800, startSize.height - deltaY));
        newY = position.y + (startSize.height - newHeight);
        break;
      case 'nw': // Northwest (top-left)
        newWidth = Math.max(350, Math.min(800, startSize.width - deltaX));
        newHeight = Math.max(400, Math.min(800, startSize.height - deltaY));
        newX = position.x + (startSize.width - newWidth);
        newY = position.y + (startSize.height - newHeight);
        break;
      case 'e': // East (right)
        newWidth = Math.max(350, Math.min(800, startSize.width + deltaX));
        break;
      case 'w': // West (left)
        newWidth = Math.max(350, Math.min(800, startSize.width - deltaX));
        newX = position.x + (startSize.width - newWidth);
        break;
      case 's': // South (bottom)
        newHeight = Math.max(400, Math.min(800, startSize.height + deltaY));
        break;
      case 'n': // North (top)
        newHeight = Math.max(400, Math.min(800, startSize.height - deltaY));
        newY = position.y + (startSize.height - newHeight);
        break;
      default:
        break;
    }

    onSizeChange({ width: newWidth, height: newHeight });
    onPositionChange({ x: newX, y: newY });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeDirection(null);
    onDraggingChange(false);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeDirection, startSize, startPos]);

  // Resize handle styles
  const resizeHandleStyle = {
    position: 'absolute',
    zIndex: 10,
  };

  const cornerHandleSize = '12px';
  const edgeHandleSize = '6px';

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onStart={handleStart}
      onDrag={handleDrag}
      onStop={handleStop}
      handle=".drag-handle"
      bounds="parent"
      disabled={isMinimized}
    >
      <div
        ref={nodeRef}
        style={{
          position: 'fixed',
          width: isMinimized ? '280px' : `${size.width}px`,
          height: isMinimized ? '60px' : `${size.height}px`,
          transition: isMinimized ? 'width 0.3s ease, height 0.3s ease' : 'none',
          cursor: isDraggingState ? 'grabbing' : 'default',
          zIndex: 2147483647, // Maximum z-index
        }}
      >
        {children}

        {/* Resize Handles - only show when not minimized */}
        {!isMinimized && (
          <>
            {/* Corner handles */}
            <div
              style={{
                ...resizeHandleStyle,
                bottom: '-6px',
                right: '-6px',
                width: cornerHandleSize,
                height: cornerHandleSize,
                cursor: 'nwse-resize',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                opacity: isResizing && resizeDirection === 'se' ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              className="taxease-resize-handle"
            />
            <div
              style={{
                ...resizeHandleStyle,
                bottom: '-6px',
                left: '-6px',
                width: cornerHandleSize,
                height: cornerHandleSize,
                cursor: 'nesw-resize',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                opacity: isResizing && resizeDirection === 'sw' ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              className="taxease-resize-handle"
            />
            <div
              style={{
                ...resizeHandleStyle,
                top: '-6px',
                right: '-6px',
                width: cornerHandleSize,
                height: cornerHandleSize,
                cursor: 'nesw-resize',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                opacity: isResizing && resizeDirection === 'ne' ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              className="taxease-resize-handle"
            />
            <div
              style={{
                ...resizeHandleStyle,
                top: '-6px',
                left: '-6px',
                width: cornerHandleSize,
                height: cornerHandleSize,
                cursor: 'nwse-resize',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                opacity: isResizing && resizeDirection === 'nw' ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              className="taxease-resize-handle"
            />

            {/* Edge handles */}
            <div
              style={{
                ...resizeHandleStyle,
                top: '0',
                right: '-3px',
                width: edgeHandleSize,
                height: '100%',
                cursor: 'ew-resize',
              }}
              onMouseDown={(e) => handleResizeStart(e, 'e')}
              className="taxease-resize-handle-edge"
            />
            <div
              style={{
                ...resizeHandleStyle,
                top: '0',
                left: '-3px',
                width: edgeHandleSize,
                height: '100%',
                cursor: 'ew-resize',
              }}
              onMouseDown={(e) => handleResizeStart(e, 'w')}
              className="taxease-resize-handle-edge"
            />
            <div
              style={{
                ...resizeHandleStyle,
                bottom: '-3px',
                left: '0',
                width: '100%',
                height: edgeHandleSize,
                cursor: 'ns-resize',
              }}
              onMouseDown={(e) => handleResizeStart(e, 's')}
              className="taxease-resize-handle-edge"
            />
            <div
              style={{
                ...resizeHandleStyle,
                top: '-3px',
                left: '0',
                width: '100%',
                height: edgeHandleSize,
                cursor: 'ns-resize',
              }}
              onMouseDown={(e) => handleResizeStart(e, 'n')}
              className="taxease-resize-handle-edge"
            />
          </>
        )}
      </div>
    </Draggable>
  );
};

export default DraggableWrapper;
