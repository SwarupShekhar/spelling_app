import React, { useState, useRef, useEffect } from 'react';
import wordList from '../Data/words.json';

const Confetti = ({ show }) => {
  if (!show) return null;
  // Simple SVG confetti burst
  return (
    <div className="confetti-overlay">
      <svg width="100vw" height="100vh" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {[...Array(80)].map((_, i) => (
          <circle
            key={i}
            cx={Math.random() * window.innerWidth}
            cy={Math.random() * window.innerHeight}
            r={Math.random() * 8 + 3}
            fill={`hsl(${Math.random() * 360}, 90%, 60%)`}
            opacity={0.7}
          />
        ))}
      </svg>
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '3rem',
        fontWeight: 'bold',
        color: '#ff9800',
        textShadow: '2px 2px 8px #fff',
        zIndex: 2
      }}>
        🎉 10 Streak! 🎉
      </div>
    </div>
  );
};

const TypingPracticeBox = () => {
  // Use the full word list for practice
  const [selectedWord, setSelectedWord] = useState(() => wordList[Math.floor(Math.random() * wordList.length)]);
  const [input, setInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [masteredWords, setMasteredWords] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [wordAttempts, setWordAttempts] = useState({});
  const [wordCorrectCounts, setWordCorrectCounts] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const sessionStart = useRef(Date.now());

  // On restart, pick a random word
  const handleRestart = () => {
    setSelectedWord(wordList[Math.floor(Math.random() * wordList.length)]);
    setInput('');
    setCorrectCount(0);
    setFeedback('');
    setMasteredWords([]);
    setShowHint(false);
    setStreak(0);
    setTotalAttempts(0);
    setBestStreak(0);
    setSessionEnded(false);
    setWordAttempts({});
    setWordCorrectCounts({});
    setShowConfetti(false);
    sessionStart.current = Date.now();
  };

  // On mount, ensure selectedWord is random from wordList
  useEffect(() => {
    setSelectedWord(wordList[Math.floor(Math.random() * wordList.length)]);
    // eslint-disable-next-line
  }, []);

  // Confetti effect when streak reaches 10
  useEffect(() => {
    if (streak === 10) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }
  }, [streak]);

  // Pronounce the word using SpeechSynthesis
  const pronounceWord = () => {
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(selectedWord.term);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    } else {
      alert('Sorry, your browser does not support speech synthesis.');
    }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    if (e.target.value === selectedWord.term) {
      setTotalAttempts((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
      setInput('');
      setFeedback('✅ Correct!');
      setStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      // Track correct count for this word
      setWordCorrectCounts(prev => {
        const newCount = (prev[selectedWord.term] || 0) + 1;
        const updated = { ...prev, [selectedWord.term]: newCount };
        // If 10 completions, reset mastered state and attempts for this word
        if (newCount === 10) {
          setTimeout(() => {
            setMasteredWords(mw => mw.filter(w => w !== selectedWord.term));
            setWordAttempts(wa => ({ ...wa, [selectedWord.term]: 0 }));
            setWordCorrectCounts(wc => ({ ...wc, [selectedWord.term]: 0 }));
          }, 3500); // after confetti
        }
        return updated;
      });
      if (!masteredWords.includes(selectedWord.term)) {
        const newMastered = [...masteredWords, selectedWord.term];
        setMasteredWords(newMastered);
        if (newMastered.length === wordList.length) {
          setSessionEnded(true);
        }
      }
      setShowHint(false);
    } else if (selectedWord.term.startsWith(e.target.value)) {
      setFeedback('');
    } else {
      // Count this as an attempt for the current word
      const currentAttempts = wordAttempts[selectedWord.term] || 0;
      if (currentAttempts < 10) {
        setWordAttempts(prev => ({
          ...prev,
          [selectedWord.term]: currentAttempts + 1
        }));
        setFeedback(`❌ Keep trying! (${currentAttempts + 1}/10 attempts)`);
      } else {
        setFeedback('❌ Max attempts reached for this word!');
      }
      setStreak(0);
    }
  };

  const handleSelect = (e) => {
    const selected = wordList.find((w) => w.term === e.target.value);
    setSelectedWord(selected);
    setInput('');
    setCorrectCount(0);
    setFeedback('');
    setShowHint(false);
    setStreak(0);
    // Show current attempts for the selected word
    const currentAttempts = wordAttempts[selected.term] || 0;
    if (currentAttempts > 0) {
      setFeedback(`Attempts for this word: ${currentAttempts}/10`);
    }
  };

  const handleRandomWord = () => {
    let randomWord;
    do {
      randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    } while (randomWord.term === selectedWord.term && wordList.length > 1);
    setSelectedWord(randomWord);
    setInput('');
    setCorrectCount(0);
    setFeedback('');
    setShowHint(false);
    setStreak(0);
    // Show current attempts for the selected word
    const currentAttempts = wordAttempts[randomWord.term] || 0;
    if (currentAttempts > 0) {
      setFeedback(`Attempts for this word: ${currentAttempts}/10`);
    }
  };

  // Progress calculation
  const progressPercent = Math.min((correctCount / wordList.length) * 100, 100);
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 100;
  const timeTaken = Math.floor((Date.now() - sessionStart.current) / 1000);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  return (
    <div className="practice-layout">
      <Confetti show={showConfetti} />
      {/* Session Summary Overlay */}
      {sessionEnded && (
        <div className="session-summary-overlay">
          <div className="session-summary">
            <h2>🎉 Session Complete!</h2>
            <p><strong>Accuracy:</strong> {accuracy}%</p>
            <p><strong>Time Taken:</strong> {minutes}m {seconds}s</p>
            <p><strong>Words Mastered:</strong> {masteredWords.length} / {wordList.length}</p>
            <p><strong>Best Streak:</strong> {bestStreak}</p>
            <button className="restart-btn" onClick={handleRestart}>Restart Session</button>
          </div>
        </div>
      )}

      {/* Word List Sidebar */}
      <div className="word-list">
        <h4 className="word-list-title">Word List</h4>
        <ul>
          {wordList.map((word) => {
            const isMastered = masteredWords.includes(word.term);
            const isSelected = selectedWord.term === word.term;
            return (
              <li
                key={word.term}
                className={`word-list-item${isMastered ? ' mastered' : ' pending'}${isSelected ? ' selected' : ''}`}
                style={{
                  fontWeight: isSelected ? 'bold' : 'normal',
                  filter: isSelected ? 'none' : 'blur(2.5px)',
                  opacity: isSelected ? 1 : 0.4,
                  cursor: 'pointer',
                  background: isSelected ? '#e3f2fd' : 'rgba(255,255,255,0.7)',
                  position: 'relative',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '180px',
                }}
                onClick={() => {
                  setSelectedWord(word);
                  setShowHint(false);
                  setStreak(0);
                }}
                title={word.term}
              >
                {isMastered ? '✅' : '•'} {word.term}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Main Practice Card */}
      <div className="card">
        <h2 className="practice-title">Spelling Practice</h2>
        <div className="word-select-row">
          <div className="word-select-group">
            <label className="word-select-label" htmlFor="word-select">Select a word to practice:</label>
            <select id="word-select" onChange={handleSelect} value={selectedWord.term} className="word-select">
              {wordList.map((word, i) => (
                <option key={i} value={word.term}>
                  {word.term}
                </option>
              ))}
            </select>
          </div>
          <button className="random-word-btn" onClick={handleRandomWord} title="Practice a random word">
            🎲 Random Word
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
          <span className="progress-bar-label">
            {correctCount} / {wordList.length} mastered
          </span>
        </div>

        {/* Hint Button and Display */}
        <button className="hint-btn" onClick={() => setShowHint(true)} disabled={showHint} title="Show a hint for this word">
          💡 Show Hint
        </button>
        {showHint && (
          <div className="hint">
            <span><strong>First letter:</strong> {selectedWord.term[0]}</span>
            <span className="hint-definition"><strong>Definition:</strong> {selectedWord.definition}</span>
          </div>
        )}

        {/* Streak Counter */}
        <div className="streak-counter">
          🔥 Streak: <strong>{streak}</strong>
        </div>

        <h3 className="word-term">
          {selectedWord.term}
          <button className="pronounce-btn" onClick={pronounceWord} title="Hear pronunciation">
            🔊
          </button>
        </h3>
        <p className="word-definition">{selectedWord.definition}</p>
        <div className="attempts-counter">
          Attempts: {wordAttempts[selectedWord.term] || 0}/10 | Correct: {wordCorrectCounts[selectedWord.term] || 0}/10
        </div>

        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Type the word here..."
          className="word-input"
        />

        <div className="feedback">{feedback}</div>
        <div className="correct-count">
          ✅ Correct attempts: <strong>{correctCount}</strong>
        </div>
      </div>
    </div>
  );
};

export default TypingPracticeBox;
