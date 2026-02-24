import React, { useEffect } from "react";
import DocumentList from "../components/DocumentList";
import { IoIosMenu } from "react-icons/io";
import SidePanel from "../components/SidePanel";
import "../styles/Documents.css";
import { useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { useAuth } from '../AuthContext';

function Documents() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState(false);
  const { user } = useAuth(); 

  console.log(user.getIdToken());
  
  return (
    <div className="documents-container">
      <h1><a href="/">StudyWeave - Your Documents</a></h1>
      <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
      <h2>Your Uploaded Documents</h2>

      <div className="toggle-control">
        <SegmentedControl
          value={view}
          onChange={setView}
          variant="filled"
          radius="xl"
          size="md"
          data={[
            { label: 'Documents', value: false },
            { label: 'Topics', value: true },
          ]}
          transitionDuration={500}
          transitionTimingFunction="linear"
        />
      </div>
      
      <DocumentList topicView={view} />

      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default Documents;