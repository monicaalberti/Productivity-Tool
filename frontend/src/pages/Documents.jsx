import React from "react";
import DocumentList from "../components/DocumentList";
import { IoIosMenu } from "react-icons/io";
import SidePanel from "../components/SidePanel";
import "../styles/Documents.css";
import { useState } from "react";

function Documents() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="documents-container">
      <h1><a href="/">StudyWeave - Your Documents</a></h1>
      <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
      
      <DocumentList />

      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default Documents;