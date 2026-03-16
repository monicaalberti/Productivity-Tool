import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../styles/JournalEditor.css";

function JournalEditor({ content, setContent }) {

  const modules = {
    toolbar: [
      ["bold", "italic", "strike"],
      [{ header: 2 }],
      [{ list: "bullet" }],
    ],
  };

  const formats = [
    "bold",
    "italic",
    "strike",
    "header",
    "list",
    "bullet"
  ];

  return (
    <div className="journal-editor">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        modules={modules}
        formats={formats}
        style={{
          borderRadius: "8px",
          height: "100%",
        }}
      />
    </div>
  );
}

export default JournalEditor;