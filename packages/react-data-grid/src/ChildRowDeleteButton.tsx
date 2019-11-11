import React from 'react';

export interface ChildRowDeleteButtonProps {
  treeDepth: number;
  onDeleteSubRow(): void;
  isDeleteSubRowEnabled: boolean;
}

export default function ChildRowDeleteButton({ treeDepth, onDeleteSubRow, isDeleteSubRowEnabled }: ChildRowDeleteButtonProps) {
  return (
    <>
      <div className="rdg-child-row-action-cross" />
      {isDeleteSubRowEnabled && (
        <div className="rdg-child-row-btn" style={{ left: treeDepth * 15 }} onClick={onDeleteSubRow} />
      )}
    </>
  );
}
