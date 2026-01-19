import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultCollapsed = false,
  defaultExpanded = false,
  className = ''
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultExpanded ? false : defaultCollapsed);

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
