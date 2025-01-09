// src/components/AnnouncementForm.tsx

import React, { useState, FormEvent, ChangeEvent } from 'react';
import styled from 'styled-components';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;

  input,
  button {
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

interface AnnouncementFormProps {
  sendAnnouncement: (announcement: string) => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ sendAnnouncement }) => {
  const [announcement, setAnnouncement] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (announcement.trim() !== '') {
      sendAnnouncement(announcement);
      setAnnouncement('');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAnnouncement(e.target.value);
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter server announcement"
        value={announcement}
        onChange={handleChange}
        required
      />
      <button type="submit">Announce</button>
    </FormContainer>
  );
};

export default AnnouncementForm;
