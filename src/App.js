import React, { useState, useRef, useEffect } from 'react';
import Confetti from 'react-confetti';
import './App.css';

const TOTAL_QUESTIONS = 5;
const MAX_ATTEMPTS = 3;
const TROPHY_KEY = 'math-game-trophies';
const DIFFICULTY_KEY = 'math-game-difficulty';
const UNLOCKED_LEVEL_KEY = 'math-game-unlocked-level';
const REWARDS_KEY = 'math-game-rewards';
const NAME_KEY = 'math-game-username';
const ANIMAL_REWARDS = ['🐶', '🐱', '🐰', '🦁', '🦉'];
const LANG_KEY = 'math-game-lang';

const DIFFICULTY_LEVELS = {
  easy: { label: 'קל', min: 1, max: 10 },
  medium: { label: 'בינוני', min: 1, max: 20 },
  hard: { label: 'קשה', min: 10, max: 50 },
};

const TRANSLATIONS = {
  he: {
    welcome: 'ברוך הבא!',
    whatIsYourName: 'מה השם שלך?',
    continue: 'המשך',
    parentSettings: 'הגדרות הורים',
    resetName: 'אפס שם משתמש',
    rewardsPage: 'עמוד פרסים',
    selectLevel: 'בחר שלב כדי להתחיל לשחק',
    hello: 'שלום',
    myRewards: 'הפרסים שלי',
    resetRewards: 'אפס פרסים',
    resetLevels: 'אפס התקדמות שלבים',
    userName: 'שם המשתמש',
    collectedRewards: 'הפרסים שנאספו',
    back: 'חזור',
    backToLevels: 'חזור לבחירת שלב',
    score: 'ניקוד',
    question: 'שאלה',
    finished: 'סיימת! ניקוד סופי',
    restart: 'התחל מחדש',
    mainTitle: name => `משחק חשבון ל${name}`,
    level: i => `שלב ${i}`,
    completed: '✔️',
    settings: '⚙️',
    rewards: '🎁',
    levels: '⬅️',
  },
  en: {
    welcome: 'Welcome!',
    whatIsYourName: 'What is your name?',
    continue: 'Continue',
    parentSettings: 'Parent Settings',
    resetName: 'Reset Name',
    rewardsPage: 'Rewards Page',
    selectLevel: 'Select a level to start playing',
    hello: 'Hello',
    myRewards: 'My Rewards',
    resetRewards: 'Reset Rewards',
    resetLevels: 'Reset Level Progress',
    userName: 'User Name',
    collectedRewards: 'Collected Rewards',
    back: 'Back',
    backToLevels: 'Back to Level Select',
    score: 'Score',
    question: 'Question',
    finished: 'Finished! Final Score',
    restart: 'Restart',
    mainTitle: name => `Math Game for ${name}`,
    level: i => `Level ${i}`,
    completed: '✔️',
    settings: '⚙️',
    rewards: '🎁',
    levels: '⬅️',
  }
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(difficulty, level = 1) {
  // Level-based difficulty, only addition and subtraction
  let min = 1, max = 10, ops = ['+'];
  if (level === 2) {
    min = 1; max = 15; ops = ['+', '-'];
  } else if (level === 3) {
    min = 5; max = 20; ops = ['+', '-'];
  } else if (level === 4) {
    min = 10; max = 30; ops = ['+', '-'];
  } else if (level >= 5) {
    min = 15; max = 50; ops = ['+', '-'];
  }
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = getRandomInt(min, max);
  let b = getRandomInt(min, max);
  if (op === '-' && b > a) [a, b] = [b, a]; // ensure a >= b for subtraction
  const question = `${a} ${op} ${b}`;
  let answer;
  if (op === '+') answer = a + b;
  else answer = a - b;
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
  const [showProgress, setShowProgress] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const saved = localStorage.getItem(UNLOCKED_LEVEL_KEY);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [showRewards, setShowRewards] = useState(false);
  const [unlockedRewards, setUnlockedRewards] = useState(() => {
    const saved = localStorage.getItem(REWARDS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [userName, setUserName] = useState(() => {
    const saved = localStorage.getItem(NAME_KEY);
    return saved || '';
  });
  const [showNamePrompt, setShowNamePrompt] = useState(!userName);
  const [tempName, setTempName] = useState('');
  const getLangFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && (urlLang === 'he' || urlLang === 'en')) {
      return urlLang;
    }
    return null;
  };

  const [lang, setLang] = useState(() => {
    const urlLang = getLangFromUrl();
    if (urlLang) {
      localStorage.setItem(LANG_KEY, urlLang);
      return urlLang;
    }
    return localStorage.getItem(LANG_KEY) || 'he';
  });
  const t = TRANSLATIONS[lang];
  const [manualAnswer, setManualAnswer] = useState('');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [lastRewardLevel, setLastRewardLevel] = useState(null);

  const TOTAL_LEVELS = 5;
  const levelCards = [];
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const unlocked = unlockedLevel >= i;
    levelCards.push(
      <div className="level-stack-item" key={i}>
        <div
          className={`level-card${unlocked ? ' unlocked' : ' locked'}`}
          onClick={() => { if (unlocked) { handleLevelSelect(i); } }}
          style={{cursor: unlocked ? 'pointer' : 'not-allowed', opacity: unlocked ? 1 : 0.5, direction: lang === 'he' ? 'rtl' : 'ltr'}}
        >
          <div className="level-title">{t.level(i)}</div>
        </div>
        {i < TOTAL_LEVELS && <div className="level-connector" />}
      </div>
    );
  }

  useEffect(() => {
    if (gameOver && score === TOTAL_QUESTIONS) {
      // Unlock reward for this level if not already unlocked
      if (!unlockedRewards.includes(currentLevel)) {
        setUnlockedRewards([...unlockedRewards, currentLevel]);
      }
      if (currentLevel === unlockedLevel && unlockedLevel < TOTAL_LEVELS) {
        setUnlockedLevel(unlockedLevel + 1);
      }
      setTimeout(() => {
        setLastRewardLevel(currentLevel);
        setShowRewardModal(true);
      }, 1200);
    }
    // eslint-disable-next-line
  }, [gameOver]);

  useEffect(() => {
    localStorage.setItem(TROPHY_KEY, trophies);
  }, [trophies]);

  useEffect(() => {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem(UNLOCKED_LEVEL_KEY, unlockedLevel);
  }, [unlockedLevel]);

  useEffect(() => {
    localStorage.setItem(REWARDS_KEY, JSON.stringify(unlockedRewards));
  }, [unlockedRewards]);

  useEffect(() => {
    if (userName) {
      localStorage.setItem(NAME_KEY, userName);
      setShowNamePrompt(false);
    }
  }, [userName]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

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
          setCurrent(generateQuestion(difficulty, currentLevel));
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
            setCurrent(generateQuestion(difficulty, currentLevel));
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
    setCurrent(generateQuestion(difficulty, currentLevel));
    setFeedback('');
    setGameOver(false);
    setAttempts(0);
    setInputDisabled(false);
  };

  const handleResetTrophies = () => {
    setTrophies(0);
  };

  const handleResetLevels = () => {
    setUnlockedLevel(1);
    setShowProgress(true);
  };

  const handleResetRewards = () => {
    setUnlockedRewards([]);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setCurrent(generateQuestion(e.target.value, currentLevel));
    setScore(0);
    setQuestionCount(1);
    setFeedback('');
    setGameOver(false);
    setAttempts(0);
    setInputDisabled(false);
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUserName(tempName.trim());
    }
  };

  const handleResetName = () => {
    setUserName('');
    setShowNamePrompt(true);
    setTempName('');
    localStorage.removeItem(NAME_KEY);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(manualAnswer, 10);
    if (!isNaN(num)) {
      handleNumberClick(num);
      setManualAnswer('');
    }
  };

  const handleLevelSelect = (level) => {
    setCurrentLevel(level);
    setShowProgress(false);
    setScore(0);
    setQuestionCount(1);
    setCurrent(generateQuestion(difficulty, level));
    setFeedback('');
    setGameOver(false);
    setAttempts(0);
    setInputDisabled(false);
    setManualAnswer('');
  };

  const handleNextLevel = () => {
    if (currentLevel < unlockedLevel) {
      handleLevelSelect(currentLevel + 1);
      setShowRewardModal(false);
    }
  };

  const handleCloseRewardModal = () => {
    setShowRewardModal(false);
    setShowProgress(true);
  };

  if (showRewardModal && lastRewardLevel) {
    return (
      <div className="App" dir="rtl">
        <header className="App-header">
          <div className="reward-modal">
            <div style={{fontSize: '1.5rem', marginBottom: '1.5em'}}>{lang === 'he' ? 'כל הכבוד! קיבלת פרס:' : 'Well done! You got a reward:'}</div>
            <div style={{fontSize: '2.5rem', marginBottom: '1em'}}>{ANIMAL_REWARDS[lastRewardLevel-1]}</div>
            {currentLevel < unlockedLevel && (
              <button className="parent-btn" onClick={handleNextLevel} style={{marginBottom: '1em'}}>
                {lang === 'he' ? `לשלב הבא (${currentLevel+1})` : `Next Level (${currentLevel+1})`}
              </button>
            )}
            <button className="parent-btn" onClick={handleCloseRewardModal}>
              {lang === 'he' ? 'חזור לבחירת שלב' : 'Back to Level Select'}
            </button>
          </div>
        </header>
      </div>
    );
  }

  if (showRewards) {
    return (
      <div className="App" dir="rtl">
        <header className="App-header">
          <h1 style={{marginBottom: '1.5em'}}>{t.myRewards}</h1>
          <div className="rewards-list">
            {ANIMAL_REWARDS.map((emoji, idx) => (
              <div key={idx} className={`reward-emoji${unlockedRewards.includes(idx + 1) ? ' unlocked' : ''}`}>{emoji}</div>
            ))}
          </div>
          <button className="parent-btn bottom-parent-btn" onClick={() => setShowSettings(true)}>
            <span role="img" aria-label="settings" style={{marginLeft: '0.5em'}}>⚙️</span>
            {t.parentSettings}
          </button>
          <button className="parent-btn bottom-parent-btn" onClick={() => setShowRewards(false)} style={{marginTop: '0.5em'}}>
            <span role="img" aria-label="back" style={{marginLeft: '0.5em'}}>{t.levels}</span>
            {t.back}
          </button>
        </header>
      </div>
    );
  }

  if (showNamePrompt) {
    return (
      <div className="App" dir="rtl">
        <header className="App-header">
          <h1>{t.welcome}</h1>
          <form onSubmit={handleNameSubmit} className="center-form" style={{marginTop: '2em'}}>
            <label style={{fontSize: '1.2rem', marginBottom: '1em'}}>{t.whatIsYourName}</label>
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              className="answer-input"
              style={{width: '180px', marginBottom: '1em'}}
              autoFocus
            />
            <button type="submit" disabled={!tempName.trim()}>
              {t.continue}
            </button>
          </form>
        </header>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="App" dir="rtl">
        <header className="App-header">
          <h1>{t.parentSettings}</h1>
          <div style={{margin: '1em 0'}}>
            <button className={`difficulty-btn${lang === 'he' ? ' selected' : ''}`} onClick={() => setLang('he')}>עברית</button>
            <button className={`difficulty-btn${lang === 'en' ? ' selected' : ''}`} onClick={() => setLang('en')}>English</button>
          </div>
          <div style={{ fontSize: '1.2rem', margin: '1em 0' }}>{t.userName}: <b>{userName}</b></div>
          <button className="restart-btn" onClick={handleResetName} style={{marginBottom: '1em'}}>
            {t.resetName}
          </button>
          <div style={{ fontSize: '2.5rem', margin: '1em 0' }}>{t.collectedRewards}: {unlockedRewards.map(idx => ANIMAL_REWARDS[idx-1]).join(' ')}</div>
          <button className="restart-btn" onClick={handleResetRewards} style={{marginBottom: '1em'}}>
            {t.resetRewards}
          </button>
          <button className="restart-btn" onClick={handleResetLevels} style={{marginBottom: '2em'}}>
            {t.resetLevels}
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
            {t.back}
          </button>
        </header>
      </div>
    );
  }

  if (showProgress) {
    return (
      <div className="App" dir="rtl">
        <header className="App-header">
          <h1 style={{marginBottom: '1.5em', textAlign: 'center'}}>{t.hello} {userName}!</h1>
          <div style={{fontSize: '1.2rem', marginBottom: '1.5em'}}>{t.selectLevel}</div>
          <div className="levels-stack">
            {levelCards}
          </div>
          <div style={{height: '2.5em'}} />
          <button className="parent-btn bottom-parent-btn" onClick={() => setShowSettings(true)}>
            <span role="img" aria-label="settings" style={{marginLeft: '0.5em'}}>{t.settings}</span>
            {t.parentSettings}
          </button>
          <button className="parent-btn bottom-parent-btn" onClick={() => setShowRewards(true)} style={{marginTop: '0.5em'}}>
            <span role="img" aria-label="rewards" style={{marginLeft: '0.5em'}}>{t.rewards}</span>
            {t.rewardsPage}
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className="App" dir="rtl">
      <header className="App-header">
        {gameOver && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} />}
        {feedback && <div className="feedback" style={{marginBottom: '0.5em'}}>{feedback}</div>}
        <h1>{t.mainTitle(userName)}</h1>
        {gameOver ? (
          <>
            <div className="score final-score" style={{ fontSize: '2rem', margin: '1em 0' }}>
              {t.finished}: {score} מתוך {TOTAL_QUESTIONS}
            </div>
            <button className="restart-btn" onClick={handleRestart}>
              {t.restart}
            </button>
          </>
        ) : (
          <>
            {/* <div className="score main-score">{t.score}: {score}</div> */}
            <p>{t.question} {questionCount} מתוך {TOTAL_QUESTIONS}</p>
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
            <form className="center-form" onSubmit={handleManualSubmit} style={{marginTop: '0.5em'}}>
              <input
                type="number"
                value={manualAnswer}
                onChange={e => setManualAnswer(e.target.value)}
                className="answer-input"
                placeholder={lang === 'he' ? 'הכנס תשובה ידנית' : 'Enter answer manually'}
                disabled={inputDisabled}
                style={{width: '120px'}}
              />
              <button type="submit" disabled={inputDisabled || manualAnswer === ''}>
                {lang === 'he' ? 'שלח' : 'Submit'}
              </button>
            </form>
          </>
        )}
        <button className="parent-btn bottom-parent-btn" onClick={() => setShowSettings(true)}>
          <span role="img" aria-label="settings" style={{marginLeft: '0.5em'}}>{t.settings}</span>
          {t.parentSettings}
        </button>
        <button className="parent-btn bottom-parent-btn" onClick={() => setShowProgress(true)} style={{marginTop: '0.5em'}}>
          <span role="img" aria-label="levels" style={{marginLeft: '0.5em'}}>{t.levels}</span>
          {t.backToLevels}
        </button>
        <button className="parent-btn bottom-parent-btn" onClick={() => setShowRewards(true)} style={{marginTop: '0.5em'}}>
          <span role="img" aria-label="rewards" style={{marginLeft: '0.5em'}}>{t.rewards}</span>
          {t.rewardsPage}
        </button>
      </header>
    </div>
  );
}

export default App;
