import React, { useState, useEffect } from "react";
import Board from "../../components/kanban/Board";
import TaskModal from "../../components/kanban/TaskModal";
import { IoIosMenu } from "react-icons/io";
import { useAuth } from '../../AuthContext';
import LoadingSpinner from "../../components/LoadingSpinner";
import SidePanel from "../../components/SidePanel";
import "../../styles/DocumentKanban.css";

function KanbanPage() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAuth();

  const handleTaskSave = (updatedTask) => {
    setTasks(prev => {
        const newBoard = { ...prev };
        for (const col in newBoard) {
          newBoard[col] = newBoard[col].map(t => 
            t.id === updatedTask.id ? updatedTask : t
          );
        }
        return newBoard;
      });
  };

  useEffect(() => {
      const fetchTasks = async () => {
        try {
          const token = await user.getIdToken();
          const response = await fetch(`http://127.0.0.1:8000/tasks`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
          });
          const data = await response.json();
          setIsLoading(false);
          setTasks(data.kanban);
        } catch (err) {
          console.error("Error fetching tasks:", err);
        }
      };
      fetchTasks();
    }, []);
    console.log(tasks);

  return (
    <div>
      <div className="header">
        <h1><a href="/"><span className="highlight">StudyWeave</span> -  My Kanban</a></h1>
        <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
      </div>
      <div className="kanban-bg-img"></div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="board-container">
          <Board data={tasks} setData={setTasks} onCardClick={setSelectedTask} />
        </div>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleTaskSave} 
        />
      )}
      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default KanbanPage;