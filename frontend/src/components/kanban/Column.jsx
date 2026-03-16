import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import Card from "./Card";
import "../../styles/Kanban.css";

function Column({ title, cards = [], onCardClick }) {  // ← default to empty array
  return (
    <div className="column">
      <h4>{title}</h4>
      <Droppable droppableId={title}>
        {(provided) => (
          <div 
            ref={provided.innerRef} 
            {...provided.droppableProps}
            style={{ minHeight: "200px" }} 
>
            {cards.map((card, index) => (
              <Card key={String(card.id)} card={card} index={index} onClick={() => onCardClick(card)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default Column;