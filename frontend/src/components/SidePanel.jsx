import React from "react";
import "../styles/SidePanel.css";
import { IoMdClose } from "react-icons/io";


function SidePanel({ isOpen, setIsOpen }) {
  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <IoMdClose className="close-icon" size={30} title="Close" onClick={() => setIsOpen(false)} />

        <ul>
        <li><a href="/">Dashboard</a></li>
        <li><a href="/upload">Upload Document</a></li>
        <li><a href="/documents">My Documents</a></li>
        <li><a href="/analytics">My Analytics</a></li>
        <li><a href="/kanban">My Kanban</a></li>
        <li><a href="/journal">My Journal</a></li>
        <li><a href="/login">Login</a></li>
        <li><a href="/register">Register</a></li>
        </ul>
    </div>
);

}

export default SidePanel;