import React, { useState, useRef } from 'react';
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
  const [masteredWords, setMasteredWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(() => {
    const nonMastered = wordList.filter(w => !masteredWords.includes(w.term));
    return nonMastered[Math.floor(Math.random() * nonMastered.length)];
  });
  const [input, setInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [wordAttempts, setWordAttempts] = useState({});
  const [wordCorrectCounts, setWordCorrectCounts] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const sessionStart = useRef(Date.now());

  // Pick a random non-mastered word
  const pickRandomWord = () => {
    const nonMastered = wordList.filter(w => !masteredWords.includes(w.term));
    if (nonMastered.length === 0) return;
    let randomWord;
    do {
      randomWord = nonMastered[Math.floor(Math.random() * nonMastered.length)];
    } while (randomWord.term === selectedWord.term && nonMastered.length > 1);
    setSelectedWord(randomWord);
    setInput('');
    setCorrectCount(0);
    setFeedback('');
    setShowHint(false);
    setStreak(0);
  };

  // Confetti effect when streak reaches 10 or word is mastered
  React.useEffect(() => {
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
        // If 10 completions, mark as mastered and show confetti
        if (newCount === 10) {
          setTimeout(() => {
            setMasteredWords(mw => [...mw, selectedWord.term]);
            setWordAttempts(wa => ({ ...wa, [selectedWord.term]: 0 }));
            setWordCorrectCounts(wc => ({ ...wc, [selectedWord.term]: 0 }));
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2500);
          }, 3500); // after streak confetti
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
            <h2>🎉 All Words Mastered!</h2>
            <p><strong>Accuracy:</strong> {accuracy}%</p>
            <p><strong>Time Taken:</strong> {minutes}m {seconds}s</p>
            <p><strong>Words Mastered:</strong> {masteredWords.length} / {wordList.length}</p>
            <p><strong>Best Streak:</strong> {bestStreak}</p>
            <button className="restart-btn" onClick={() => window.location.reload()}>Restart</button>
          </div>
        </div>
      )}

      {/* Magical Vertical Slider/List */}
      <div className="word-list magical-slider">
        <h4 className="word-list-title">Word List</h4>
        <ul>
          {wordList.map((word) => {
            const isMastered = masteredWords.includes(word.term);
            const isSelected = selectedWord.term === word.term;
            return (
              <li
                key={word.term}
                className={`word-list-item${isMastered ? ' mastered' : ' pending'}${isSelected ? ' selected magical-glow' : ''}`}
                style={{
                  fontWeight: isSelected ? 'bold' : 'normal',
                  filter: isSelected ? 'none' : 'blur(2.5px)',
                  opacity: isSelected ? 1 : 0.4,
                  cursor: 'pointer',
                  background: isSelected ? '#e3f2fd' : 'none',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(.17,.67,.83,.67)',
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
                {isSelected && <span className="magic-wand" style={{color:'#ffd600', marginRight:4}} title="Current word">🪄</span>}
                {isMastered ? '✅' : '•'} {word.term}
              </li>
            );
          })}
        </ul>
        <button className="random-word-btn" onClick={pickRandomWord} title="Pick a random word!">
          🎲 Random Word
        </button>
      </div>

      {/* Main Practice Card */}
      <div className="card">
        <h2 className="practice-title">Spelling Practice</h2>
        <div className="word-select-row">
          <div className="word-select-group">
            <label className="word-select-label" htmlFor="word-select">Select a word to practice:</label>
            <select id="word-select" onChange={e => setSelectedWord(wordList.find(w => w.term === e.target.value))} value={selectedWord.term} className="word-select">
              {wordList.map((word, i) => (
                <option key={i} value={word.term}>
                  {word.term}
                </option>
              ))}
            </select>
          </div>
          <button className="random-word-btn" onClick={pickRandomWord} title="Pick a random word!" disabled={sessionEnded}>
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
