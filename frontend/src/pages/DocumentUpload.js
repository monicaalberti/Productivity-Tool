import React from "react";
import '../components/UploadBox';
import UploadBox from "../components/UploadBox";

function DocumentUpload() {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: formData
    });
  };

  return(
    <div>
        <input type="file" onChange={handleUpload} />
        <UploadBox />
    </div>
    
  ) 
}

export default DocumentUpload;
