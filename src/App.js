import React, { useState } from 'react';
import './App.css';
import TypingPracticeBox from './components/TypingPracticeBox';

function App() {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div className={`App ${theme}`}>
      <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle dark/light mode">
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </button>
      <h1 className="main-heading">
        Master of Spells <span role="img" aria-label="magic wand">🪄</span>
      </h1>
      <TypingPracticeBox theme={theme} />
    </div>
  );
}

export default App;
