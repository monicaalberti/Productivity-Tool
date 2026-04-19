import React from "react";
import "../styles/SidePanel.css";
import { IoMdClose } from "react-icons/io";
import { Link } from "react-router-dom";


function SidePanel({ isOpen, setIsOpen }) {
  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <IoMdClose className="close-icon" size={30} title="Close" onClick={() => setIsOpen(false)} />

        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/upload">Upload Document</Link></li>
          <li><Link to="/documents">My Documents</Link></li>
          <li><Link to="/analytics">My Analytics</Link></li>
          <li><Link to="/kanban">My Kanban</Link></li>
          <li><Link to="/journal">My Journal</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
        </ul>
    </div>
);

}

export default SidePanel;