import React, { useEffect, useState, useCallback } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
  // Các state được nhóm lại theo chức năng
  const [cursorState, setCursorState] = useState({
    position: { x: 0, y: 0 },
    isClicked: false,
    isLinkHovered: false,
    isHidden: false
  });

  // State riêng cho trails để tránh render lại không cần thiết
  const [trails, setTrails] = useState([]);

  // Các hàm xử lý sự kiện được tối ưu với useCallback
  const updateCursorPosition = useCallback((x, y) => {
    setCursorState(prev => ({
      ...prev,
      position: { x, y }
    }));
  }, []);

  const updateCursorState = useCallback((key, value) => {
    setCursorState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const addTrailPoint = useCallback((x, y) => {
    const point = { x, y, id: Date.now() };
    setTrails(prevTrails => [...prevTrails, point]);
    
    setTimeout(() => {
      setTrails(prevTrails => prevTrails.filter(t => t.id !== point.id));
    }, 500);
  }, []);

  // Các event handlers được tối ưu với useCallback
  const handleMouseMove = useCallback((e) => {
    updateCursorPosition(e.clientX, e.clientY);
    addTrailPoint(e.clientX, e.clientY);
  }, [updateCursorPosition, addTrailPoint]);

  const handleMouseDown = useCallback(() => {
    updateCursorState('isClicked', true);
  }, [updateCursorState]);

  const handleMouseUp = useCallback(() => {
    updateCursorState('isClicked', false);
  }, [updateCursorState]);

  const handleMouseEnter = useCallback(() => {
    updateCursorState('isHidden', false);
  }, [updateCursorState]);

  const handleMouseLeave = useCallback(() => {
    updateCursorState('isHidden', true);
  }, [updateCursorState]);

  const handleLinkHoverStart = useCallback(() => {
    updateCursorState('isLinkHovered', true);
  }, [updateCursorState]);

  const handleLinkHoverEnd = useCallback(() => {
    updateCursorState('isLinkHovered', false);
  }, [updateCursorState]);

  // Setup và cleanup event listeners
  useEffect(() => {
    // Danh sách các elements cần theo dõi hover
    const interactiveElements = [
      'a',
      'button',
      '.nav-item',
      '.sensor-card',
      '.action-btn',
      'input',
      '.motor-badge',
      '.distance-value'
    ].join(',');

    // Thêm event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Thêm hover listeners cho các interactive elements
    const links = document.querySelectorAll(interactiveElements);
    links.forEach(link => {
      link.addEventListener('mouseenter', handleLinkHoverStart);
      link.addEventListener('mouseleave', handleLinkHoverEnd);
    });

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);

      links.forEach(link => {
        link.removeEventListener('mouseenter', handleLinkHoverStart);
        link.removeEventListener('mouseleave', handleLinkHoverEnd);
      });
    };
  }, [
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseEnter,
    handleMouseLeave,
    handleLinkHoverStart,
    handleLinkHoverEnd
  ]);

  // Tách các class names thành biến để dễ quản lý
  const cursorClasses = `cursor-dot 
    ${cursorState.isClicked ? 'cursor-click' : ''} 
    ${cursorState.isLinkHovered ? 'link-grow' : ''}`.trim();

  const outlineClasses = `cursor-dot-outline 
    ${cursorState.isClicked ? 'cursor-click' : ''} 
    ${cursorState.isLinkHovered ? 'link-grow' : ''}`.trim();

  // Style objects được tách riêng để dễ quản lý
  const cursorStyle = {
    left: cursorState.position.x,
    top: cursorState.position.y,
    opacity: cursorState.isHidden ? 0 : 1
  };

  return (
    <>
      {/* Trail effects */}
      {trails.map(trail => (
        <div
          key={trail.id}
          className="cursor-trail"
          style={{
            left: trail.x,
            top: trail.y
          }}
        />
      ))}

      {/* Main cursor */}
      <div
        className={cursorClasses}
        style={cursorStyle}
      />

      {/* Cursor outline */}
      <div
        className={outlineClasses}
        style={cursorStyle}
      />
    </>
  );
};

export default CustomCursor; 