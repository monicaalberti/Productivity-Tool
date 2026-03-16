import React, { useState } from "react";
import '../components/UploadBox';
import UploadBox from "../components/UploadBox";
import { IoIosMenu } from "react-icons/io";
import SidePanel from "../components/SidePanel";
import '../styles/DocumentUpload.css';

function DocumentUpload() {
  const [isOpen, setIsOpen] = useState(false);

  return(
    <div className="upload-container">
      <div className="header">
        <h1><a href="/"><span className="highlight">StudyWeave</span> - Upload your Document</a></h1>
        <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
      </div>
      <div className="box">
        <UploadBox />
      </div>
      

      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
    
  ) 
}
export default DocumentUpload;