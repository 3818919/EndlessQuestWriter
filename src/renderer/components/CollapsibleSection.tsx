import React, { useState } from 'react';

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultCollapsed = false,
  className = ''
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`collapsible-section ${className}`}>
      <div 
        className="collapsible-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3>{title}</h3>
        <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>
          ▼
        </span>
      </div>
      
      {!isCollapsed && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
}
