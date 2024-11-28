import React, { useState, useEffect } from "react";
import axios from 'axios';

function DataFetchingComponent() {

  const API_URL = "http://localhost:8080";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        //const response = await axios.get("https://jsonplaceholder.typicode.com/posts");
        const response = await axios.get(`${API_URL}/users`);
        setData(response.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false); 
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Ładowanie danych...</div>;
  if (error) return <div>Błąd: {error}</div>;

  return (
    <div>
      <h1>Pobrane dane:</h1>
      <ul>
        {data.map((item) => (
          <li key={item.id}>{item.username}</li>
        ))}
      </ul>
    </div>
  );
}

export default DataFetchingComponent;
