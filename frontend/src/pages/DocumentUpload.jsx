import React, { useState } from "react";
import '../components/UploadBox';
import UploadBox from "../components/UploadBox";
import { IoIosMenu } from "react-icons/io";
import SidePanel from "../components/SidePanel";
import '../styles/DocumentUpload.css';
// import { useAuth } from "../AuthContext";

function DocumentUpload() {
  const [isOpen, setIsOpen] = useState(false);
  // const { user } = useAuth();

  // const handleUpload = async (e) => {
  //   const file = e.target.files[0];
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   const token = await user.getIdToken();

  //   await fetch("http://127.0.0.1:8000/upload", {
  //     method: "POST",
  //     headers: {
  //       "Authorization": `Bearer ${token}`
  //     },
  //     body: formData
  //   });
  // };

  return(
    <div className="upload-container">
      
      <h1><a href="/">StudyWeave - Upload your Document</a></h1>
      <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
      
      
      <UploadBox />

      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
    
  ) 
}

export default DocumentUpload;