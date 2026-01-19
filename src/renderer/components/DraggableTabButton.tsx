import React, { useState, DragEvent } from 'react';

interface DraggableTabButtonProps {
  id: string;
  isActive: boolean;
  isMinimized: boolean;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLButtonElement>) => void;
  onDrop: (targetId: string) => void;
  isDragging: boolean;
}

const DraggableTabButton: React.FC<DraggableTabButtonProps> = ({
  id,
  isActive,
  isMinimized,
  title,
  icon,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    onDragStart(id);
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(id);
  };

  return (
    <button
      className={`left-sidebar-button ${isActive && !isMinimized ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onClick={onClick}
      title={title}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {icon}
    </button>
  );
};

export default DraggableTabButton;
