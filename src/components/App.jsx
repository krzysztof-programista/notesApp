import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Note from "./Note";
import CreateArea from "./CreateArea";
import Login from "./Login"
import Register from "./Register";
import useToken from "./useToken";
import axios from "axios";

function App() {
  const { token, setToken } = useToken();
  const [notes, setNotes] = useState([]);
  const [loggedUser, setLoggedUser] = useState(() => {
    const savedUser = localStorage.getItem("loggedUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // console.log("calling from App.jsx. TokenValue: " + token);
  // console.log("loggedUser: ");
  // console.log(loggedUser);
  // console.log(null);
  // console.log("token: ");
  // console.log(token);
  // console.log(notes);

  function handleLogin(user) {
    fetchNotes();
    localStorage.setItem('loggedUser', JSON.stringify(user));
    setLoggedUser((prevValue) => {
      return user;
    })
  };

  function handleLogout() {
    localStorage.removeItem("loggedUser");
    setToken(null);//xd
    localStorage.removeItem("token");
    setLoggedUser((prevValue) => {
      return null;
    })
  };

  function handleRegister(user) {
    localStorage.setItem('loggedUser', JSON.stringify(user));
    setLoggedUser((prevValue) => {
      return user;
    })
  };

  async function addNote(newNote) {
    try {
      const response = await axios.post(
        'http://localhost:8080/newNote',
        {
          title: newNote.title,
          content: newNote.content
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotes(prevNotes => [
        ...prevNotes,
        {
          id: response.data.noteId, // ID zwrócone z serwera
          title: newNote.title,
          content: newNote.content,
        }
      ]);
    } catch (error) {
      console.error('Błąd podczas dodawania notatki:', error);
    }
  }

  async function deleteNote(noteId) {
    try {
      const response = await axios.delete(
        'http://localhost:8080/deleteNote',
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { id: noteId }
        }
      );

      setNotes(prevNotes => {
        return prevNotes.filter((noteItem) => {
          return noteItem.id !== noteId;
        });
      });
    } catch (error) {
      console.error('Błąd podczas usuwania notatki:', error);
    }
  }

  async function editNote(editedNote) {
    try {
      const response = await axios.patch(
        'http://localhost:8080/editNote',
        {
          id: editedNote.id,
          title: editedNote.title,
          content: editedNote.content
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === editedNote.id ? { ...note, ...editedNote } : note
        )
      );

    } catch (error) {
      console.error('Błąd podczas edytowania notatki:', error);
    }
  }

  async function fetchNotes() {
    if (token === null) return;
    try {
      const response = await axios.get('http://localhost:8080/notes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = response.data.map(note => ({
        id: note.id,
        title: note.title,
        content: note.note_text,
      }));

      // console.log(response.data);
      // console.log(result);
      setNotes(result);

    } catch (error) {
      console.error('Błąd podczas pobierania notatek:', error);
    }
  };

  //po odświeżeniu strony lub zmianie zależności
  useEffect(() => {
    fetchNotes();
  }, [token]);

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login setToken={setToken} onLogin={handleLogin} />} />
          <Route path="/register" element={<Register setToken={setToken} onRegister={handleRegister} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <div>
      <Header userName={loggedUser?.username || "gość"} onLogout={handleLogout} />
      <CreateArea onAdd={addNote} />
      {notes.map((noteItem) => {
        return (
          <Note
            key={noteItem.id}
            id={noteItem.id}
            title={noteItem.title}
            content={noteItem.content}
            onDelete={deleteNote}
            onEdit={editNote}
          />
        );
      })}
      <Footer />
    </div>
  );
}

export default App;
//shift+alt+f do wyrównania treści
