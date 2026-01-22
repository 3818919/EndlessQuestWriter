import React, { ReactNode, useEffect, useRef } from 'react';

export interface ListItem {
  id: number;
  name: string;
  icon?: ReactNode;
  secondaryText?: string;
  hoverText?: string;
  data?: any;
}

interface GenericListProps {
  items: ListItem[];
  selectedId: number | null;
  onSelectItem: (id: number) => void;
  onDoubleClick?: (item: ListItem) => void;
  minimized: boolean;
  emptyMessage: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, item: ListItem) => void;
  scrollToSelected?: boolean;
}

const GenericList: React.FC<GenericListProps> = ({
  items,
  selectedId,
  onSelectItem,
  onDoubleClick,
  minimized,
  emptyMessage,
  draggable = false,
  onDragStart,
  scrollToSelected = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToSelected && selectedId !== null && scrollContainerRef.current) {    
      const selectedElement = scrollContainerRef.current.querySelector(`[data-item-id="${selectedId}"]`) as HTMLElement;
      
      if (selectedElement) {      
        const container = scrollContainerRef.current;
        const itemTop = selectedElement.offsetTop;
        const itemHeight = selectedElement.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollPosition = itemTop - (containerHeight / 2) + (itemHeight / 2);
              
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedId, scrollToSelected]);

  return (
    <div className="items-scroll" ref={scrollContainerRef}>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <ul className="items-list">
          {items.map(item => (
            <li
              key={item.id}
              data-item-id={item.id}
              className={`item-row ${selectedId === item.id ? 'selected' : ''}`}
              onClick={() => onSelectItem(item.id)}
              onDoubleClick={() => onDoubleClick?.(item)}
              draggable={draggable}
              onDragStart={(e) => onDragStart?.(e, item)}
              title={minimized ? item.hoverText || `${item.name} (#${item.id})` : item.hoverText}
            >
              {item.icon}
              {!minimized && (
                <div className="item-info">
                  <span className="item-id">#{item.id}</span>
                  <span className="item-name" title={item.name}>{item.name}</span>
                  {item.secondaryText && (
                    <span className="item-type" title={item.secondaryText}>{item.secondaryText}</span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GenericList;
