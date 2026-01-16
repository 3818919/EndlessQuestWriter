import React, { useState } from 'react';

export default function Tooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    setIsVisible(true);
    updatePosition(e);
  };

  const handleMouseMove = (e) => {
    updatePosition(e);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const updatePosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: e.clientX,
      y: rect.top - 10
    });
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', display: 'contents' }}
    >
      {children}
      {isVisible && content && (
        <div
          className="custom-tooltip"
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 10000
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
