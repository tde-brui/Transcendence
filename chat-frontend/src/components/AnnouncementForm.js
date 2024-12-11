// src/components/AnnouncementForm.js

import React, { useState } from 'react';
import styled from 'styled-components';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;

  input, button {
    margin-top: 5px;
    padding: 8px;
    font-size: 14px;
  }

  button {
    cursor: pointer;
    background-color: #4CAF50;
    color: white;
    border: none;
  }
`;

function AnnouncementForm({ sendAnnouncement }) {
  const [announcement, setAnnouncement] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (announcement.trim() !== '') {
      sendAnnouncement(announcement);
      setAnnouncement('');
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter announcement"
        value={announcement}
        onChange={(e) => setAnnouncement(e.target.value)}
        required
      />
      <button type="submit">Announce</button>
    </FormContainer>
  );
}

export default AnnouncementForm;
