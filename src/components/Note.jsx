import React, { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

function Note(props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState({
    id: props.id,
    title: props.title,
    content: props.content,
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setEditedNote((prevNote) => {
      return {
        ...prevNote,
        [name]: value,
      };
    });
  }

  function handleSave() {
    props.onEdit(editedNote);
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setEditedNote({
      id: props.id,
      title: props.title,
      content: props.content,
    });
  }

  return (
    <div className="note">
      {isEditing ?
        <div className="note-edit">
          <input
            name="title"
            type="text"
            value={editedNote.title}
            onChange={handleChange} />
          <textarea
            name="content"
            value={editedNote.content}
            onChange={handleChange} />
          <button onClick={handleSave}>
            <SaveIcon />
          </button>
          <button onClick={handleCancel}>
            <CancelIcon />
          </button>
        </div>
        : <div>
          <h1>{props.title}</h1>
          <p>{props.content}</p>
          <button onClick={() => props.onDelete(props.id)}>
            <DeleteIcon />
          </button>
          <button onClick={() => setIsEditing(true)}>
            <EditIcon />
          </button>
        </div>}
    </div>
  );
}

export default Note;
