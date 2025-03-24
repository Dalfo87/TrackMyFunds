// src/components/User/UserProfile.js
import React from 'react';
import { useUser } from '../../hooks/useUser';

function UserProfile() {
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useUser();
  
  if (isLoading) return <div>Caricamento...</div>;
  
  if (!isAuthenticated) {
    return <div>Utente non autenticato</div>;
  }
  
  const handleUpdateName = () => {
    const newName = prompt('Inserisci nuovo nome:', user.name);
    if (newName) {
      updateProfile({ name: newName });
    }
  };
  
  return (
    <div className="user-profile">
      <h2>Profilo Utente</h2>
      <p>Nome: {user.name}</p>
      <p>Email: {user.email}</p>
      <button onClick={handleUpdateName}>Modifica Nome</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default UserProfile;