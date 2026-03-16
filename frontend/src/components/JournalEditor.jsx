import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "../styles/JournalEditor.css";

function JournalEditor({ content, setContent }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="journal-editor">
      <div className="editor-palette" style={{ marginBottom: "8px" }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
      </div>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          height: "100%",
          padding: "12px",
        }}
      >
        <EditorContent className="editor" editor={editor} />
      </div>
    </div>
  );
}
export default JournalEditor;
