import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import "../styles/UploadBox.css";
import { useAuth } from "../AuthContext";
import { IoCloudUploadOutline } from "react-icons/io5";

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
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        console.log("Upload successful:", data);
        navigate("/documents");
      } catch (error) {
        console.error("Upload error:", error);
      }
    },
    [user, navigate]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`upload-box ${isDragActive ? "drag-active" : ""}`}

    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the file here...</p>
      ) : (
        <p>
          <IoCloudUploadOutline size={80} style={{color: "#EFBF04"}}/><br/>
          Drag & drop or{" "}
          <span onClick={open} className="select-btn">
            click here
          </span>{" "}
          to select a file
        </p>
      )}
    </div>
  );
}

export default UploadBox;