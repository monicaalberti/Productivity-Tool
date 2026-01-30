import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import "../styles/UploadBox.css";
import { useAuth } from "../AuthContext";

function UploadBox() {

  const { user } = useAuth();
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append("file", file);
    const token = await user.getIdToken();

    fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    })
      .then((res) => res.json())
      .then(console.log)
      .catch(console.error);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`upload-box ${isDragActive ? 'drag-active' : ''}`}
      style={{
        backgroundColor: isDragActive ? "#e0e0e0" : "#f9f9f9",
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the file here...</p> : <p>Drag & drop a file here, or click to select</p>}
    </div>
  );
}

export default UploadBox;