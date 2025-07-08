import React, { useState, useRef, useEffect } from 'react';
import wordList from '../Data/words.json';

function getRandomWords(arr, n) {
  const result = [];
  const used = new Set();
  while (result.length < n && used.size < arr.length) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(arr[idx]);
    }
  }
  return result;
}

const SESSION_WORD_COUNT = 10;

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
  // Session words state
  const [sessionWords, setSessionWords] = useState(() => getRandomWords(wordList, SESSION_WORD_COUNT));
  // Pick a random word from sessionWords on load
  const [selectedWord, setSelectedWord] = useState(() => sessionWords[Math.floor(Math.random() * sessionWords.length)]);
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

  // On restart, pick new session words and a random selected word
  const handleRestart = () => {
    const newSessionWords = getRandomWords(wordList, SESSION_WORD_COUNT);
    setSessionWords(newSessionWords);
    setSelectedWord(newSessionWords[Math.floor(Math.random() * newSessionWords.length)]);
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

  // On mount, ensure selectedWord is random from sessionWords
  useEffect(() => {
    setSelectedWord(sessionWords[Math.floor(Math.random() * sessionWords.length)]);
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
        if (newMastered.length === sessionWords.length) {
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
    const selected = sessionWords.find((w) => w.term === e.target.value);
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
      randomWord = sessionWords[Math.floor(Math.random() * sessionWords.length)];
    } while (randomWord.term === selectedWord.term && sessionWords.length > 1);
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
  const progressPercent = Math.min((correctCount / SESSION_WORD_COUNT) * 100, 100);
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
            <p><strong>Words Mastered:</strong> {masteredWords.length} / {SESSION_WORD_COUNT}</p>
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
            const isSession = sessionWords.some(w => w.term === word.term);
            const isMastered = masteredWords.includes(word.term);
            const isSelected = selectedWord.term === word.term;
            return (
              <li
                key={word.term}
                className={`word-list-item${isSession ? ' session-word' : ''}${isMastered ? ' mastered' : ' pending'}${isSelected ? ' selected' : ''}`}
                style={{
                  fontWeight: isSelected ? 'bold' : 'normal',
                  filter: isSelected ? 'none' : isSession ? 'blur(0.5px)' : 'blur(2.5px)',
                  opacity: isSelected ? 1 : isSession ? 0.85 : 0.4,
                  cursor: isSession ? 'pointer' : 'not-allowed',
                  pointerEvents: isSession ? 'auto' : 'none',
                  background: isSelected ? '#e3f2fd' : isSession ? 'rgba(255,255,255,0.7)' : 'none',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
                onClick={isSession ? () => {
                  setSelectedWord(word);
                  setShowHint(false);
                  setStreak(0);
                } : undefined}
                title={isSession ? 'Practice this word' : 'Not in this session'}
              >
                {isSession && <span style={{color:'#ffd600', marginRight:4}} title="Session word">🪄</span>}
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
          <label className="word-select-label">
            Select a word to practice:
            <select onChange={handleSelect} value={selectedWord.term} className="word-select">
              {sessionWords.map((word, i) => (
                <option key={i} value={word.term}>
                  {word.term}
                </option>
              ))}
            </select>
          </label>
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
            {correctCount} / {SESSION_WORD_COUNT} mastered
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
