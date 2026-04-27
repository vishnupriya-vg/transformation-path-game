import { useState, useCallback } from 'react';
import { PUZZLES } from './data/puzzles';
import {
  isValidWord,
  addLetter,
  removeLetter,
  replaceLetter,
} from './utils/wordUtils';
import PathDisplay from './components/PathDisplay';
import WordTiles from './components/WordTiles';
import OperationButtons from './components/OperationButtons';
import LetterPicker from './components/LetterPicker';
import WinScreen from './components/WinScreen';
import HintModal from './components/HintModal';
import './App.css';

function initState(puzzle) {
  return {
    currentWord: puzzle.start,
    path: [puzzle.start],
    moves: 0,
    selectedOp: null,
    selectedPos: null,
    errorMsg: '',
    won: false,
  };
}

export default function App() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [gameState, setGameState] = useState(() => initState(PUZZLES[0]));
  const [showHint, setShowHint] = useState(false);
  const [screen, setScreen] = useState('menu');

  const puzzle = PUZZLES[levelIdx];

  const resetLevel = useCallback((idx) => {
    const i = idx !== undefined ? idx : levelIdx;
    setGameState(initState(PUZZLES[i]));
    setShowHint(false);
  }, [levelIdx]);

  function handleSelectOp(op) {
    setGameState(s => ({ ...s, selectedOp: op, selectedPos: null, errorMsg: '' }));
  }

  function handleCancelOp() {
    setGameState(s => ({ ...s, selectedOp: null, selectedPos: null, errorMsg: '' }));
  }

  function handleSelectPos(pos) {
    const { selectedOp, currentWord } = gameState;
    if (selectedOp === 'remove') {
      applyMove(removeLetter(currentWord, pos));
    } else {
      setGameState(s => ({ ...s, selectedPos: pos, errorMsg: '' }));
    }
  }

  function handlePickLetter(ch) {
    const { selectedOp, selectedPos, currentWord } = gameState;
    let newWord;
    if (selectedOp === 'add') newWord = addLetter(currentWord, selectedPos, ch);
    else if (selectedOp === 'replace') newWord = replaceLetter(currentWord, selectedPos, ch);
    if (newWord) applyMove(newWord);
  }

  function applyMove(newWord) {
    if (!isValidWord(newWord)) {
      setGameState(s => ({
        ...s,
        errorMsg: `"${newWord}" is not a valid word. Try again!`,
        selectedPos: null,
      }));
      return;
    }
    const won = newWord === puzzle.target;
    setGameState(s => ({
      ...s,
      currentWord: newWord,
      path: [...s.path, newWord],
      moves: s.moves + 1,
      selectedOp: null,
      selectedPos: null,
      errorMsg: '',
      won,
    }));
  }

  function handleUndo() {
    setGameState(s => {
      if (s.path.length <= 1) return s;
      const newPath = s.path.slice(0, -1);
      return {
        ...s,
        currentWord: newPath[newPath.length - 1],
        path: newPath,
        moves: s.moves - 1,
        selectedOp: null,
        selectedPos: null,
        errorMsg: '',
        won: false,
      };
    });
  }

  const needsLetterPicker =
    (gameState.selectedOp === 'add' && gameState.selectedPos !== null) ||
    (gameState.selectedOp === 'replace' && gameState.selectedPos !== null);

  const currentLetter =
    gameState.selectedOp === 'replace' && gameState.selectedPos !== null
      ? gameState.currentWord[gameState.selectedPos]
      : null;

  if (screen === 'menu') {
    return (
      <div className="app">
        <div className="menu-screen">
          <h1 className="menu-title">Transformation<br />Path</h1>
          <p className="menu-subtitle">
            Transform one word into another using<br />
            <strong>Add</strong>, <strong>Remove</strong>, or <strong>Replace</strong> — one letter at a time.
          </p>
          <div className="menu-example">
            <span className="menu-example-label">Example path:</span>
            <div className="menu-example-path">
              {['at', 'cat', 'cut', 'cute'].map((w, i, arr) => (
                <span key={i}>
                  <span className="menu-example-word">{w}</span>
                  {i < arr.length - 1 && <span className="menu-example-arrow">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="level-grid">
            {PUZZLES.map((p, i) => (
              <button
                key={p.id}
                className={`level-btn level-btn--${p.difficulty}`}
                onClick={() => {
                  setLevelIdx(i);
                  setGameState(initState(PUZZLES[i]));
                  setShowHint(false);
                  setScreen('game');
                }}
              >
                <span className="level-btn__label">{p.label}</span>
                <span className="level-btn__words">{p.start} → {p.target}</span>
                <span className={`level-btn__diff diff--${p.difficulty}`}>{p.difficulty}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="game-header">
        <button className="btn-back" onClick={() => setScreen('menu')}>← Levels</button>
        <span className="game-header__level">{puzzle.label}</span>
        <div className="game-header__moves">{gameState.moves} move{gameState.moves !== 1 ? 's' : ''}</div>
      </header>

      <main className="game-main">
        <div className="target-banner">
          <span className="target-label">Target</span>
          <span className="target-word">{puzzle.target}</span>
        </div>

        <PathDisplay path={gameState.path} targetWord={puzzle.target} />

        <div className="current-section">
          <div className="current-label">Current word</div>
          <WordTiles
            word={gameState.currentWord}
            selectedOp={gameState.selectedOp}
            selectedPos={gameState.selectedPos}
            onSelectPos={handleSelectPos}
          />
        </div>

        {gameState.errorMsg && (
          <div className="error-msg">{gameState.errorMsg}</div>
        )}

        {!needsLetterPicker && (
          <OperationButtons
            selectedOp={gameState.selectedOp}
            onSelect={handleSelectOp}
            onCancel={handleCancelOp}
          />
        )}

        {gameState.selectedOp === 'add' && gameState.selectedPos === null && (
          <p className="instruction">Tap <strong>+</strong> to choose where to insert a letter</p>
        )}
        {gameState.selectedOp === 'remove' && (
          <p className="instruction">Tap a letter to <strong>remove</strong> it</p>
        )}
        {gameState.selectedOp === 'replace' && gameState.selectedPos === null && (
          <p className="instruction">Tap a letter to <strong>replace</strong> it</p>
        )}

        {needsLetterPicker && (
          <LetterPicker onPick={handlePickLetter} disabledLetter={currentLetter} />
        )}

        <div className="game-actions">
          <button className="btn btn--ghost" onClick={handleUndo} disabled={gameState.path.length <= 1}>
            ↩ Undo
          </button>
          <button className="btn btn--ghost" onClick={() => setShowHint(true)}>
            ? Hint
          </button>
          <button className="btn btn--ghost" onClick={() => resetLevel()}>
            ↺ Restart
          </button>
        </div>
      </main>

      {gameState.won && (
        <WinScreen
          path={gameState.path}
          moves={gameState.moves}
          puzzle={puzzle}
          hasNext={levelIdx < PUZZLES.length - 1}
          onRetry={() => resetLevel()}
          onNext={() => {
            const next = levelIdx + 1;
            setLevelIdx(next);
            setGameState(initState(PUZZLES[next]));
            setShowHint(false);
          }}
        />
      )}

      {showHint && (
        <HintModal hint={puzzle.hint} onClose={() => setShowHint(false)} />
      )}
    </div>
  );
}
