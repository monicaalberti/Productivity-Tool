import React from "react";
import { Draggable } from "@hello-pangea/dnd";

function Card({ card, index, onClick }) {
  console.log("card of the task: ", card);
  return (
    
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="card"
        >
          <h4>{card.title}</h4>
          <p>Priority: {card.priority}</p>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={onClick}>
            View Details
          </button>
          {card.status === "DONE" && (
            <>
              <br/>
              <a href={`/tasks/${card.id}/exercises`} className="practice-link">
                🧠 Practice
              </a>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default Card;