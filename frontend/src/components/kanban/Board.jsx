import React from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import Column from "./Column";
import "../../styles/Kanban.css";
import { useAuth } from '../../AuthContext';

function Board({ data, setData, onCardClick }) {
  const { user } = useAuth();

  const handleDragEnd = async ({ source, destination }) => {
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const sourceItems = [...data[sourceCol]];
    const destItems = sourceCol === destCol ? sourceItems : [...data[destCol]];

    const [moved] = sourceItems.splice(source.index, 1);

    // only change status if column changed
    if (sourceCol !== destCol) {
      moved.status = destCol;
    }

    destItems.splice(destination.index, 0, moved);

    setData({
      ...data,
      [sourceCol]: sourceItems,
      [destCol]: destItems,
    });

    // update backend only if column changed
    if (sourceCol !== destCol) {
      try {
        const token = await user.getIdToken();

        await fetch(`http://127.0.0.1:8000/tasks/${moved.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ status: destCol }),
        });

      } catch (err) {
        console.error("Failed to update task status:", err);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board">
        {Object.keys(data).map((col) => (
          <Column
            key={col}
            title={col}
            cards={data[col]}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

export default Board;