import React from "react";
import DocumentList from "../components/DocumentList";
import TopicLists from "./TopicLists";
import { IoIosMenu } from "react-icons/io";
import SidePanel from "../components/SidePanel";
import "../styles/Documents.css";
import { useState } from "react";
import { SegmentedControl } from "@mantine/core";

function Documents() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState(false);

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
      
      {view === false ? <DocumentList /> : <TopicLists />}

      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default Documents;