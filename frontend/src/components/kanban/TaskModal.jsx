import React, { useState } from "react";
import "../../styles/Kanban.css";
import { useAuth } from '../../AuthContext';

function TaskModal({ task, onClose, onSave }) {
  const [edited, setEdited] = useState(task);
  const { user } = useAuth();

  const handleChange = (field) => (e) => {
    setEdited({ ...edited, [field]: e.target.value }); // ← just update state, no token needed here
  };

  const handleSave = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://127.0.0.1:8000/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: edited.title,
          description: edited.description,
          priority: edited.priority,
          estimated_time: edited.estimated_time,
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
      onSave(edited);  // ← tell parent the task was updated
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Edit Task</h3>
        <input
          value={edited.title}
          onChange={handleChange("title")}
          placeholder="Title"
        />
        <textarea
          value={edited.description}
          onChange={handleChange("description")}
          placeholder="Description"
        />
        <select value={edited.priority} onChange={handleChange("priority")}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="number"
          value={edited.estimated_time}
          onChange={handleChange("estimated_time")}
          placeholder="Estimated Time (mins)"
        />
        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;