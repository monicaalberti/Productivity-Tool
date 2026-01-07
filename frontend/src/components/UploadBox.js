import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

function UploadBox() {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
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
      style={{
        border: "2px solid gray",
        padding: "10%",
        textAlign: "center",
        borderRadius: "10px",
        backgroundColor: isDragActive ? "#e0e0e0" : "#f9f9f9",
        margin:"20px",
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the file here...</p> : <p>Drag & drop a file here, or click to select</p>}
    </div>
  );
}

export default UploadBox;
