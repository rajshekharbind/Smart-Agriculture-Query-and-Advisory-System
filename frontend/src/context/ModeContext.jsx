/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
  const [userMode, setUserMode] = useState(() => localStorage.getItem('agrosathi_mode') || 'easy');
  const [appLanguage, setAppLanguage] = useState(
    () => localStorage.getItem('agrosathi_lang') || 'Hindi'
  );

  useEffect(() => {
    localStorage.setItem('agrosathi_mode', userMode);
  }, [userMode]);

  useEffect(() => {
    localStorage.setItem('agrosathi_lang', appLanguage);
  }, [appLanguage]);

  const isEasy = userMode === 'easy';
  const isHindi = appLanguage === 'Hindi';

  // Helper returning Hindi when Hindi is active, otherwise English
  const t = (enText, hiText) => (isHindi && hiText ? hiText : enText);

  return (
    <ModeContext.Provider
      value={{
        userMode,
        setUserMode,
        isEasy,
        appLanguage,
        setAppLanguage,
        isHindi,
        t,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => useContext(ModeContext);
