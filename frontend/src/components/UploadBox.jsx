import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import "../styles/UploadBox.css";
import { useAuth } from "../AuthContext";

function UploadBox() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const onDrop = useCallback(
    async (acceptedFiles) => {
      try {
        if (!user) {
          console.error("User not authenticated");
          return;
        }

        const file = acceptedFiles[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const token = await user.getIdToken();

        const response = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        console.log("Upload successful:", data);

        // Navigate only after successful upload
        navigate("/documents");
      } catch (error) {
        console.error("Upload error:", error);
      }
    },
    [user, navigate]
  );

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`upload-box ${isDragActive ? "drag-active" : ""}`}
      style={{
        backgroundColor: isDragActive ? "#e0e0e0" : "#f9f9f9",
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the file here...</p>
      ) : (
        <p>Drag & drop a file here, or click to select</p>
      )}
    </div>
  );
}

export default UploadBox;
