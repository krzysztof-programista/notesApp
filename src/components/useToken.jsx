import React, { useState } from 'react';

function useToken() {

  const getToken = () => {
    const tokenString = localStorage.getItem('token');
    // console.log("wywołanie getToken(): " + tokenString);
    return tokenString || null;
  };

  const [token, setToken] = useState(getToken());

  const saveToken = (userToken) => {
    localStorage.setItem('token', userToken);
    // console.log("wywołanie setToken()")
    setToken(userToken);
  }

  return {
    setToken: saveToken,
    token
  }

}

export default useToken;