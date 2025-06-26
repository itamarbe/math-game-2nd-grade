import React, { useState, useRef, useEffect } from 'react';
import Confetti from 'react-confetti';
import './App.css';

const TOTAL_QUESTIONS = 5;
const MAX_ATTEMPTS = 3;
const TROPHY_KEY = 'math-game-trophies';
const DIFFICULTY_KEY = 'math-game-difficulty';

const DIFFICULTY_LEVELS = {
  easy: { label: 'קל', min: 1, max: 10 },
  medium: { label: 'בינוני', min: 1, max: 20 },
  hard: { label: 'קשה', min: 10, max: 50 },
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(difficulty) {
  const { min, max } = DIFFICULTY_LEVELS[difficulty];
  const op = Math.random() > 0.5 ? '+' : '-';
  let a = getRandomInt(min, max);
  let b = getRandomInt(min, max);
  if (op === '-' && b > a) [a, b] = [b, a]; // ensure a >= b for subtraction
  const question = `${a} ${op === '+' ? '+' : '-'} ${b}`;
  const answer = op === '+' ? a + b : a - b;
  return { question, answer, op };
}

function App() {
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(() => {
    const saved = localStorage.getItem(DIFFICULTY_KEY);
    return saved || 'easy';
  });
  const [current, setCurrent] = useState(() => generateQuestion(localStorage.getItem(DIFFICULTY_KEY) || 'easy'));
  const [feedback, setFeedback] = useState('');
  const [questionCount, setQuestionCount] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [trophies, setTrophies] = useState(() => {
    const saved = localStorage.getItem(TROPHY_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (gameOver && score === TOTAL_QUESTIONS) {
      setTrophies(t => t + 1);
    }
    // eslint-disable-next-line
  }, [gameOver]);

  useEffect(() => {
    localStorage.setItem(TROPHY_KEY, trophies);
  }, [trophies]);

  useEffect(() => {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  }, [difficulty]);

  const handleNumberClick = (num) => {
    if (inputDisabled) return;
    if (num === current.answer) {
      setScore(score + 1);
      setFeedback('🎉 כל הכבוד! תשובה נכונה!');
      setInputDisabled(true);
      setTimeout(() => {
        if (questionCount >= TOTAL_QUESTIONS) {
          setGameOver(true);
        } else {
          setCurrent(generateQuestion(difficulty));
          setFeedback('');
          setQuestionCount(questionCount + 1);
          setAttempts(0);
          setInputDisabled(false);
        }
      }, 1200);
    } else {
      if (attempts + 1 >= MAX_ATTEMPTS) {
        setFeedback(`❌ התשובה הנכונה היא ${current.answer}`);
        setInputDisabled(true);
        setTimeout(() => {
          if (questionCount >= TOTAL_QUESTIONS) {
            setGameOver(true);
          } else {
            setCurrent(generateQuestion(difficulty));
            setFeedback('');
            setQuestionCount(questionCount + 1);
            setAttempts(0);
            setInputDisabled(false);
          }
        }, 1800);
      } else {
        setFeedback(`❌ נסה שוב! (${attempts + 1} מתוך ${MAX_ATTEMPTS})`);
        setAttempts(attempts + 1);
      }
    }
  };

  const handleRestart = () => {
    setScore(0);
    setQuestionCount(1);
    setCurrent(generateQuestion(difficulty));
    setFeedback('');
    setGameOver(false);
    setAttempts(0);
    setInputDisabled(false);
  };

  const handleResetTrophies = () => {
    setTrophies(0);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setCurrent(generateQuestion(e.target.value));
    setScore(0);
    setQuestionCount(1);
    setFeedback('');
    setGameOver(false);
    setAttempts(0);
    setInputDisabled(false);
  };

  if (showSettings) {
    return (
      <div className="App" dir="rtl">
        <header className="App-header">
          <h1>הגדרות הורים</h1>
          <div style={{ fontSize: '2.5rem', margin: '1em 0' }}>מספר גביעים נוכחי: {'🏆'.repeat(trophies)}</div>
          <button className="restart-btn" onClick={handleResetTrophies} style={{marginBottom: '2em'}}>
            אפס גביעים
          </button>
          <div style={{margin: '2em 0'}}>
            <label style={{fontSize: '1.2rem', marginLeft: '1em'}}>רמת קושי:</label>
            <div style={{display: 'inline-flex', gap: '0.5em'}}>
              {Object.entries(DIFFICULTY_LEVELS).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDifficultyChange({ target: { value: key } })}
                  className={`difficulty-btn${difficulty === key ? ' selected' : ''}`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowSettings(false)}>
            חזור למשחק
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className="App" dir="rtl">
      <header className="App-header">
        {gameOver && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} />}
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5em', minHeight: '3rem' }}>
          {'🏆'.repeat(trophies)}
        </div>
        {feedback && <div className="feedback" style={{marginBottom: '0.5em'}}>{feedback}</div>}
        <h1>משחק חשבון ליובל</h1>
        {gameOver ? (
          <>
            <div className="score final-score" style={{ fontSize: '2rem', margin: '1em 0' }}>
              סיימת! ניקוד סופי: {score} מתוך {TOTAL_QUESTIONS}
            </div>
            <button className="restart-btn" onClick={handleRestart}>
              התחל מחדש
            </button>
          </>
        ) : (
          <>
            <div className="score main-score">ניקוד: {score}</div>
            <p>שאלה {questionCount} מתוך {TOTAL_QUESTIONS}</p>
            <div className="question-box">
              <span dir="ltr">{current.question} = ?</span>
            </div>
            <div className="number-buttons-grid">
              {Array.from({ length: 31 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className="number-btn"
                  onClick={() => handleNumberClick(i)}
                  disabled={inputDisabled}
                >
                  {i}
                </button>
              ))}
            </div>
          </>
        )}
        <button className="parent-btn bottom-parent-btn" onClick={() => setShowSettings(true)}>
          <span role="img" aria-label="settings" style={{marginLeft: '0.5em'}}>⚙️</span>
          הגדרות הורים
        </button>
      </header>
    </div>
  );
}

export default App;
