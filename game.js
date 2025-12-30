/**
 * Block Blast - Game Logic
 * Phase 1-5: Core Foundation, Piece Interaction, Game Mechanics, Scoring & Game State, Polish & UX
 *
 * This file contains the core game classes:
 * - Piece: Represents a block piece with shape and color
 * - Grid: Manages the 8x8 game grid state and rendering
 * - DragController: Handles drag-and-drop piece placement with touch optimization
 * - Game: Main game controller with scoring, line clearing, game over detection, and high scores
 */

// ============================================
// PIECE DEFINITIONS
// Each piece is defined as a 2D array where 1 = filled, 0 = empty
// ============================================

const PIECE_DEFINITIONS = {
    // Horizontal lines
    line3h: {
        shape: [[1, 1, 1]],
        color: '#00D4FF' // cyan
    },
    line4h: {
        shape: [[1, 1, 1, 1]],
        color: '#00D4FF' // cyan
    },

    // Vertical lines
    line3v: {
        shape: [[1], [1], [1]],
        color: '#00D4FF' // cyan
    },
    line4v: {
        shape: [[1], [1], [1], [1]],
        color: '#00D4FF' // cyan
    },

    // Squares
    square2: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#FFD700' // yellow
    },
    square3: {
        shape: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ],
        color: '#FFD700' // yellow
    },

    // L-shapes (4 orientations)
    lShape1: {
        shape: [
            [1, 0],
            [1, 0],
            [1, 1]
        ],
        color: '#FF8C00' // orange
    },
    lShape2: {
        shape: [
            [1, 1, 1],
            [1, 0, 0]
        ],
        color: '#FF8C00' // orange
    },
    lShape3: {
        shape: [
            [1, 1],
            [0, 1],
            [0, 1]
        ],
        color: '#FF8C00' // orange
    },
    lShape4: {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#FF8C00' // orange
    },

    // T-shapes (4 orientations)
    tShape1: {
        shape: [
            [1, 1, 1],
            [0, 1, 0]
        ],
        color: '#B388FF' // purple
    },
    tShape2: {
        shape: [
            [0, 1],
            [1, 1],
            [0, 1]
        ],
        color: '#B388FF' // purple
    },
    tShape3: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#B388FF' // purple
    },
    tShape4: {
        shape: [
            [1, 0],
            [1, 1],
            [1, 0]
        ],
        color: '#B388FF' // purple
    },

    // Z-shapes (2 orientations)
    zShape1: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#FF5252' // red
    },
    zShape2: {
        shape: [
            [0, 1],
            [1, 1],
            [1, 0]
        ],
        color: '#FF5252' // red
    },

    // S-shapes (2 orientations)
    sShape1: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00E676' // green
    },
    sShape2: {
        shape: [
            [1, 0],
            [1, 1],
            [0, 1]
        ],
        color: '#00E676' // green
    }
};

// List of piece type names for random selection
const PIECE_TYPES = Object.keys(PIECE_DEFINITIONS);

// ============================================
// PIECE CLASS
// Represents a single game piece with its shape and color
// ============================================

class Piece {
    /**
     * Create a new piece
     * @param {string} type - The piece type key from PIECE_DEFINITIONS
     */
    constructor(type) {
        const definition = PIECE_DEFINITIONS[type];
        if (!definition) {
            throw new Error(`Unknown piece type: ${type}`);
        }

        this.type = type;
        this.shape = definition.shape;
        this.color = definition.color;
        this.rows = this.shape.length;
        this.cols = this.shape[0].length;
    }

    /**
     * Create a random piece
     * @returns {Piece} A randomly selected piece
     */
    static createRandom() {
        const randomIndex = Math.floor(Math.random() * PIECE_TYPES.length);
        return new Piece(PIECE_TYPES[randomIndex]);
    }

    /**
     * Get all filled cell coordinates in the piece
     * @returns {Array<{row: number, col: number}>} Array of filled cell positions
     */
    getFilledCells() {
        const cells = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.shape[row][col] === 1) {
                    cells.push({ row, col });
                }
            }
        }
        return cells;
    }
}

// ============================================
// GRID CLASS
// Manages the 8x8 game grid state and rendering
// ============================================

class Grid {
    /**
     * Create a new grid
     * @param {number} size - Grid dimensions (default 8x8)
     */
    constructor(size = 8) {
        this.size = size;
        this.element = document.getElementById('game-grid');

        // Initialize 2D array: null = empty, color string = filled
        this.state = this.createEmptyState();

        // Render the initial grid
        this.render();
    }

    /**
     * Create an empty grid state
     * @returns {Array<Array<null>>} 2D array filled with nulls
     */
    createEmptyState() {
        return Array(this.size).fill(null).map(() =>
            Array(this.size).fill(null)
        );
    }

    /**
     * Reset the grid to empty state
     */
    reset() {
        this.state = this.createEmptyState();
        this.render();
    }

    /**
     * Check if a cell is within grid bounds
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if within bounds
     */
    isValidCell(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    /**
     * Check if a cell is empty
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if empty
     */
    isCellEmpty(row, col) {
        return this.isValidCell(row, col) && this.state[row][col] === null;
    }

    /**
     * Set a cell's color (fill it)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} color - Color to fill with
     */
    setCell(row, col, color) {
        if (this.isValidCell(row, col)) {
            this.state[row][col] = color;
        }
    }

    /**
     * Clear a cell (set to empty)
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    clearCell(row, col) {
        if (this.isValidCell(row, col)) {
            this.state[row][col] = null;
        }
    }

    /**
     * Check if a piece can be placed at the given grid position
     * @param {Piece} piece - The piece to place
     * @param {number} gridRow - Target row on grid (top-left of piece)
     * @param {number} gridCol - Target column on grid (top-left of piece)
     * @returns {boolean} True if placement is valid
     */
    canPlacePiece(piece, gridRow, gridCol) {
        const filledCells = piece.getFilledCells();

        for (const cell of filledCells) {
            const targetRow = gridRow + cell.row;
            const targetCol = gridCol + cell.col;

            // Check bounds
            if (!this.isValidCell(targetRow, targetCol)) {
                return false;
            }

            // Check if cell is empty
            if (this.state[targetRow][targetCol] !== null) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the bounding rect of a specific cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {DOMRect|null} The cell's bounding rectangle
     */
    getCellRect(row, col) {
        const cell = this.element.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        return cell ? cell.getBoundingClientRect() : null;
    }

    /**
     * Convert page coordinates to grid row/col
     * @param {number} pageX - X coordinate on page
     * @param {number} pageY - Y coordinate on page
     * @returns {{row: number, col: number}|null} Grid position or null if outside grid
     */
    pageToGrid(pageX, pageY) {
        const gridRect = this.element.getBoundingClientRect();

        // Check if point is within grid bounds
        if (pageX < gridRect.left || pageX > gridRect.right ||
            pageY < gridRect.top || pageY > gridRect.bottom) {
            return null;
        }

        // Calculate cell size including gap
        const cellSize = gridRect.width / this.size;

        const col = Math.floor((pageX - gridRect.left) / cellSize);
        const row = Math.floor((pageY - gridRect.top) / cellSize);

        // Clamp to valid range
        return {
            row: Math.max(0, Math.min(this.size - 1, row)),
            col: Math.max(0, Math.min(this.size - 1, col))
        };
    }

    /**
     * Show ghost preview of piece placement
     * @param {Piece} piece - The piece to preview
     * @param {number} gridRow - Target row
     * @param {number} gridCol - Target column
     * @param {boolean} isValid - Whether placement is valid
     */
    showGhost(piece, gridRow, gridCol, isValid) {
        this.clearGhost();

        const filledCells = piece.getFilledCells();

        for (const cell of filledCells) {
            const targetRow = gridRow + cell.row;
            const targetCol = gridCol + cell.col;

            if (this.isValidCell(targetRow, targetCol)) {
                const cellElement = this.element.querySelector(
                    `[data-row="${targetRow}"][data-col="${targetCol}"]`
                );

                if (cellElement) {
                    cellElement.classList.add('ghost');
                    if (isValid) {
                        cellElement.classList.add('ghost-valid');
                        cellElement.style.setProperty('--ghost-color', piece.color);
                    } else {
                        cellElement.classList.add('ghost-invalid');
                    }
                }
            }
        }
    }

    /**
     * Clear all ghost previews from the grid
     */
    clearGhost() {
        const ghostCells = this.element.querySelectorAll('.ghost');
        ghostCells.forEach(cell => {
            cell.classList.remove('ghost', 'ghost-valid', 'ghost-invalid');
            cell.style.removeProperty('--ghost-color');
        });
    }

    /**
     * Find all complete rows (all 8 cells filled)
     * @returns {number[]} Array of row indices that are complete
     */
    findCompleteRows() {
        const completeRows = [];
        for (let row = 0; row < this.size; row++) {
            let isComplete = true;
            for (let col = 0; col < this.size; col++) {
                if (this.state[row][col] === null) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                completeRows.push(row);
            }
        }
        return completeRows;
    }

    /**
     * Find all complete columns (all 8 cells filled)
     * @returns {number[]} Array of column indices that are complete
     */
    findCompleteCols() {
        const completeCols = [];
        for (let col = 0; col < this.size; col++) {
            let isComplete = true;
            for (let row = 0; row < this.size; row++) {
                if (this.state[row][col] === null) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                completeCols.push(col);
            }
        }
        return completeCols;
    }

    /**
     * Get all cells that need to be cleared (in complete rows/cols)
     * @param {number[]} rows - Complete row indices
     * @param {number[]} cols - Complete column indices
     * @returns {Array<{row: number, col: number}>} Cells to clear
     */
    getCellsToClear(rows, cols) {
        const cellsSet = new Set();

        // Add cells from complete rows
        for (const row of rows) {
            for (let col = 0; col < this.size; col++) {
                cellsSet.add(`${row},${col}`);
            }
        }

        // Add cells from complete columns
        for (const col of cols) {
            for (let row = 0; row < this.size; row++) {
                cellsSet.add(`${row},${col}`);
            }
        }

        // Convert back to array of objects
        return Array.from(cellsSet).map(key => {
            const [row, col] = key.split(',').map(Number);
            return { row, col };
        });
    }

    /**
     * Add clearing animation class to cells
     * @param {Array<{row: number, col: number}>} cells - Cells to animate
     */
    animateClearCells(cells) {
        for (const { row, col } of cells) {
            const cellElement = this.element.querySelector(
                `[data-row="${row}"][data-col="${col}"]`
            );
            if (cellElement) {
                cellElement.classList.add('clearing');
            }
        }
    }

    /**
     * Clear cells from the grid state and update visuals
     * @param {Array<{row: number, col: number}>} cells - Cells to clear
     */
    clearCells(cells) {
        for (const { row, col } of cells) {
            this.state[row][col] = null;

            const cellElement = this.element.querySelector(
                `[data-row="${row}"][data-col="${col}"]`
            );
            if (cellElement) {
                cellElement.classList.remove('filled', 'clearing');
                cellElement.style.backgroundColor = '';
            }
        }
    }

    /**
     * Add place animation to specific cells
     * @param {Array<{row: number, col: number}>} cells - Cells to animate
     */
    animatePlaceCells(cells) {
        for (const { row, col } of cells) {
            const cellElement = this.element.querySelector(
                `[data-row="${row}"][data-col="${col}"]`
            );
            if (cellElement) {
                cellElement.classList.add('placing');
                // Remove animation class after it completes
                setTimeout(() => {
                    cellElement.classList.remove('placing');
                }, 200);
            }
        }
    }

    /**
     * Update a single cell's visual appearance
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    updateCellVisual(row, col) {
        const cellElement = this.element.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
        );
        if (!cellElement) return;

        const color = this.state[row][col];
        if (color) {
            cellElement.classList.add('filled');
            cellElement.style.backgroundColor = color;
        } else {
            cellElement.classList.remove('filled');
            cellElement.style.backgroundColor = '';
        }
    }

    /**
     * Render the grid to the DOM
     */
    render() {
        this.element.innerHTML = '';

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // If cell has a color, apply it
                const color = this.state[row][col];
                if (color) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = color;
                }

                this.element.appendChild(cell);
            }
        }
    }
}

// ============================================
// SOUND MANAGER
// Plays sound effects
// ============================================

const SoundManager = {
  enabled: true,
  pools: {},
  poolSize: 3,
  initialized: false,
  bgMusic: null,
  bgMusicVolume: 0.3,
  audioContext: null,
  gainNodes: {},

  init() {
    if (this.initialized) return;

    // Create Web Audio API context for amplification
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const soundFiles = {
      place: 'sounds/place.mp3',
      clear: 'sounds/sweep.mp3',
      combo: 'sounds/combo.mp3',
      gameOver: 'sounds/gameover.mp3',
      highScore: 'sounds/highscore.mp3',
      youLose: 'sounds/youlose.mp3'
    };

    // Volumes > 1.0 will amplify the sound
    const volumes = {
      place: 0.4,
      clear: 0.4,
      combo: 2.5,
      gameOver: 0.5,
      highScore: 0.7,
      youLose: 2.5
    };

    // Initialize background music
    this.bgMusic = new Audio('sounds/background.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.bgMusicVolume;
    this.bgMusic.preload = 'auto';

    // Create pool of Audio objects for each sound with Web Audio API gain
    for (const [name, src] of Object.entries(soundFiles)) {
      this.pools[name] = [];
      this.gainNodes[name] = [];

      for (let i = 0; i < this.poolSize; i++) {
        const audio = new Audio(src);
        audio.preload = 'auto';

        // Create gain node for amplification
        const source = this.audioContext.createMediaElementSource(audio);
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volumes[name] || 0.5;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        this.pools[name].push(audio);
        this.gainNodes[name].push(gainNode);
      }
    }

    // Load saved preference
    const saved = localStorage.getItem('blockblast-sound');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }

    // Start background music on first user interaction (browser autoplay policy)
    const startMusic = () => {
      // Resume audio context (required by some browsers)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.playBackgroundMusic();
      document.removeEventListener('pointerdown', startMusic);
      document.removeEventListener('keydown', startMusic);
    };
    document.addEventListener('pointerdown', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });

    this.initialized = true;
    console.log('SoundManager initialized, enabled:', this.enabled);
  },

  play(soundName) {
    if (!this.enabled) {
      return;
    }

    const pool = this.pools[soundName];
    if (!pool || pool.length === 0) {
      console.warn('Sound not found:', soundName);
      return;
    }

    // Find an audio element that's not currently playing
    let audio = pool.find(a => a.paused || a.ended);

    // If all are playing, just use the first one
    if (!audio) {
      audio = pool[0];
    }

    audio.currentTime = 0;
    audio.play().catch(err => {
      console.warn('Sound play failed:', soundName, err.message);
    });
  },

  playPlace() { this.play('place'); },
  playClear() { this.play('clear'); },
  playCombo() { this.play('combo'); },
  playGameOver() { return this.playWithCallback('gameOver'); },
  playHighScore() { this.play('highScore'); },
  playYouLose() { this.play('youLose'); },

  // Play a sound and return a promise that resolves when it ends
  playWithCallback(soundName) {
    return new Promise((resolve) => {
      if (!this.enabled) {
        resolve();
        return;
      }

      const pool = this.pools[soundName];
      if (!pool || pool.length === 0) {
        resolve();
        return;
      }

      let audio = pool.find(a => a.paused || a.ended);
      if (!audio) {
        audio = pool[0];
      }

      audio.currentTime = 0;
      audio.onended = () => resolve();
      audio.play().catch(() => resolve());
    });
  },

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('blockblast-sound', this.enabled.toString());
    console.log('Sound toggled:', this.enabled);
    // Control background music
    if (this.enabled) {
      this.playBackgroundMusic();
    } else {
      this.pauseBackgroundMusic();
    }
    return this.enabled;
  },

  playBackgroundMusic() {
    if (!this.enabled || !this.bgMusic) return;
    this.bgMusic.play().catch(() => {});
  },

  pauseBackgroundMusic() {
    if (!this.bgMusic) return;
    this.bgMusic.pause();
  },

  stopBackgroundMusic() {
    if (!this.bgMusic) return;
    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
  }
};

// ============================================
// DRAG CONTROLLER CLASS
// Handles drag-and-drop piece placement
// ============================================

class DragController {
    /**
     * Create a new drag controller
     * @param {Game} game - Reference to the game instance
     */
    constructor(game) {
        this.game = game;

        // Drag state
        this.isDragging = false;
        this.draggedPiece = null;
        this.draggedPieceIndex = null;
        this.dragElement = null;

        // Touch offset to prevent finger from hiding piece
        this.touchOffsetY = -60;

        // Track last valid grid position for snapping
        this.lastGridPos = null;

        // Bind methods to preserve context
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);

        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Set up all event listeners for drag-and-drop
     */
    initEventListeners() {
        const tray = this.game.trayElement;

        // Use pointer events for unified mouse/touch handling
        tray.addEventListener('pointerdown', this.handlePointerDown);
        document.addEventListener('pointermove', this.handlePointerMove);
        document.addEventListener('pointerup', this.handlePointerUp);

        // Prevent context menu on long press (mobile)
        tray.addEventListener('contextmenu', e => e.preventDefault());

        // Prevent text selection while dragging
        document.addEventListener('selectstart', e => {
            if (this.isDragging) e.preventDefault();
        });
    }

    /**
     * Handle pointer down (start drag)
     * @param {PointerEvent} e
     */
    handlePointerDown(e) {
        // Don't allow dragging during animations or game over
        if (!this.game.canInteract()) return;

        // Find the tray-piece element that was clicked
        const pieceElement = e.target.closest('.tray-piece');
        if (!pieceElement) return;

        const index = parseInt(pieceElement.dataset.index, 10);
        const piece = this.game.trayPieces[index];

        // Can't drag a piece that doesn't exist
        if (!piece) return;

        // Prevent default to avoid text selection, scrolling
        e.preventDefault();

        // Capture pointer for reliable tracking
        pieceElement.setPointerCapture(e.pointerId);

        // Start drag
        this.isDragging = true;
        this.draggedPiece = piece;
        this.draggedPieceIndex = index;

        // Mark the original piece as being dragged (dimmed)
        pieceElement.classList.add('dragging-source');

        // Create the floating drag element
        this.createDragElement(piece, e.clientX, e.clientY);

        // Add body class to prevent scrolling
        document.body.classList.add('is-dragging');
    }

    /**
     * Create the floating drag element that follows cursor
     * @param {Piece} piece - The piece being dragged
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    createDragElement(piece, x, y) {
        const container = document.createElement('div');
        container.className = 'drag-piece';

        // Set grid template based on piece dimensions
        // Use same cell size as grid for proper snapping visual
        const cellSize = this.getCellSize();
        const gap = 2;
        container.style.gridTemplateColumns = `repeat(${piece.cols}, ${cellSize}px)`;
        container.style.gridTemplateRows = `repeat(${piece.rows}, ${cellSize}px)`;
        container.style.gap = `${gap}px`;

        // Apply touch offset for mobile
        const isTouchDevice = 'ontouchstart' in window;
        const touchOffset = isTouchDevice ? this.touchOffsetY : 0;

        // Position with top-left at cursor (offset by half a cell so cursor is in first cell center)
        const offsetX = cellSize / 2;
        const offsetY = cellSize / 2;
        container.style.transform = `translate(${x - offsetX}px, ${y - offsetY + touchOffset}px)`;

        // Create cells
        for (let row = 0; row < piece.rows; row++) {
            for (let col = 0; col < piece.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'drag-cell';

                if (piece.shape[row][col] === 1) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = piece.color;
                } else {
                    cell.classList.add('empty');
                }

                container.appendChild(cell);
            }
        }

        // Add to DOM
        document.body.appendChild(container);
        this.dragElement = container;
    }

    /**
     * Get current cell size from CSS
     * @returns {number} Cell size in pixels
     */
    getCellSize() {
        const gridRect = this.game.grid.element.getBoundingClientRect();
        return gridRect.width / this.game.grid.size;
    }

    /**
     * Position the drag element at given coordinates
     * @param {HTMLElement} element - The drag element
     * @param {number} x - Client X coordinate
     * @param {number} y - Client Y coordinate
     */
    positionDragElement(element, x, y) {
        // Offset by half a cell so cursor is in the center of the first cell
        const cellSize = this.getCellSize();
        const offsetX = cellSize / 2;
        const offsetY = cellSize / 2;

        // Apply touch offset for mobile (move piece up so finger doesn't hide it)
        const isTouchDevice = 'ontouchstart' in window;
        const touchOffset = isTouchDevice ? this.touchOffsetY : 0;

        element.style.transform = `translate(${x - offsetX}px, ${y - offsetY + touchOffset}px)`;
    }

    /**
     * Handle pointer move (during drag)
     * @param {PointerEvent} e
     */
    handlePointerMove(e) {
        if (!this.isDragging || !this.dragElement) return;

        e.preventDefault();

        // Move the drag element
        this.positionDragElement(this.dragElement, e.clientX, e.clientY);

        // Check for grid position and update ghost preview
        this.updateGhostPreview(e.clientX, e.clientY);
    }

    /**
     * Update the ghost preview based on cursor position
     * @param {number} x - Client X coordinate
     * @param {number} y - Client Y coordinate
     */
    updateGhostPreview(x, y) {
        const grid = this.game.grid;

        // Apply same touch offset when calculating grid position
        const isTouchDevice = 'ontouchstart' in window;
        const touchOffset = isTouchDevice ? this.touchOffsetY : 0;
        const adjustedY = y + touchOffset;

        // Convert cursor position to grid coordinates
        const gridPos = grid.pageToGrid(x, adjustedY);

        if (!gridPos) {
            // Cursor is outside grid
            grid.clearGhost();
            this.lastGridPos = null;
            return;
        }

        // Check if position changed (avoid unnecessary updates)
        if (this.lastGridPos &&
            this.lastGridPos.row === gridPos.row &&
            this.lastGridPos.col === gridPos.col) {
            return;
        }

        this.lastGridPos = gridPos;

        // Check if placement is valid
        const isValid = grid.canPlacePiece(this.draggedPiece, gridPos.row, gridPos.col);

        // Show ghost preview
        grid.showGhost(this.draggedPiece, gridPos.row, gridPos.col, isValid);
    }

    /**
     * Handle pointer up (end drag)
     * @param {PointerEvent} e
     */
    handlePointerUp(e) {
        if (!this.isDragging) return;

        const grid = this.game.grid;

        // Apply touch offset for final position check
        const isTouchDevice = 'ontouchstart' in window;
        const touchOffset = isTouchDevice ? this.touchOffsetY : 0;
        const adjustedY = e.clientY + touchOffset;

        // Check where we're dropping
        const gridPos = grid.pageToGrid(e.clientX, adjustedY);

        let placementSuccessful = false;

        if (gridPos) {
            const isValid = grid.canPlacePiece(this.draggedPiece, gridPos.row, gridPos.col);

            if (isValid) {
                // Valid placement!
                placementSuccessful = true;

                // Place the piece on the grid (handles everything: filling, clearing, scoring)
                this.game.placePiece(this.draggedPiece, gridPos.row, gridPos.col, this.draggedPieceIndex);
            }
        }

        // Clear ghost preview
        grid.clearGhost();

        // Clean up drag element
        if (!placementSuccessful) {
            // Animate return to tray
            this.animateReturnToTray();
        } else {
            // Just remove the drag element
            this.removeDragElement();
        }

        // Reset drag state
        this.endDrag();
    }

    /**
     * Animate the piece returning to the tray (invalid drop)
     */
    animateReturnToTray() {
        if (!this.dragElement) return;

        // Get the source piece element position
        const sourceElement = this.game.trayElement.querySelector(
            `.tray-piece[data-index="${this.draggedPieceIndex}"]`
        );

        if (sourceElement) {
            const sourceRect = sourceElement.getBoundingClientRect();
            const dragRect = this.dragElement.getBoundingClientRect();

            // Calculate the delta to animate to
            const deltaX = sourceRect.left + sourceRect.width / 2 - (dragRect.left + dragRect.width / 2);
            const deltaY = sourceRect.top + sourceRect.height / 2 - (dragRect.top + dragRect.height / 2);

            // Add return animation class
            this.dragElement.classList.add('returning');

            // Get current transform and add the delta
            const currentTransform = this.dragElement.style.transform;
            const match = currentTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);

            if (match) {
                const currentX = parseFloat(match[1]);
                const currentY = parseFloat(match[2]);
                this.dragElement.style.transform = `translate(${currentX + deltaX}px, ${currentY + deltaY}px) scale(0.5)`;
            }

            // Remove after animation
            setTimeout(() => {
                this.removeDragElement();
            }, 200);
        } else {
            this.removeDragElement();
        }
    }

    /**
     * Remove the drag element from DOM
     */
    removeDragElement() {
        if (this.dragElement) {
            this.dragElement.remove();
            this.dragElement = null;
        }
    }

    /**
     * Reset drag state and clean up
     */
    endDrag() {
        // Remove dragging-source class from any pieces that still have it
        // (placed pieces will have had this removed in removePieceFromTray)
        const sourceElements = this.game.trayElement.querySelectorAll('.dragging-source');
        sourceElements.forEach(el => {
            // Only remove if not already placed
            if (!el.classList.contains('placed')) {
                el.classList.remove('dragging-source');
            }
        });

        // Reset state
        this.isDragging = false;
        this.draggedPiece = null;
        this.draggedPieceIndex = null;
        this.lastGridPos = null;

        // Remove body class
        document.body.classList.remove('is-dragging');
    }

    /**
     * Clean up event listeners (for game reset)
     */
    destroy() {
        const tray = this.game.trayElement;
        tray.removeEventListener('pointerdown', this.handlePointerDown);
        document.removeEventListener('pointermove', this.handlePointerMove);
        document.removeEventListener('pointerup', this.handlePointerUp);
    }
}

// ============================================
// GAME CLASS
// Main game controller
// ============================================

class Game {
    constructor() {
        // Initialize game components
        this.grid = new Grid(8);
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.trayPieces = [];

        // Game state flags
        this.isAnimating = false;
        this.isGameOver = false;

        // Cache DOM elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.trayElement = document.getElementById('piece-tray');
        this.newGameButton = document.getElementById('btn-new-game');
        this.gameContainer = document.querySelector('.game-container');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalScoreElement = document.getElementById('final-score');
        this.newHighScoreMessage = document.getElementById('new-high-score');
        this.playAgainButton = document.getElementById('btn-play-again');

        // Bind event handlers
        this.newGameButton.addEventListener('click', () => this.handleNewGameClick());
        if (this.playAgainButton) {
            this.playAgainButton.addEventListener('click', () => this.startNewGame());
        }

        // Initialize sound and sound button
        this.soundButton = document.getElementById('btn-sound');
        SoundManager.init();
        this.updateSoundButton();

        if (this.soundButton) {
            this.soundButton.addEventListener('click', () => {
                SoundManager.toggle();
                this.updateSoundButton();
            });
        }

        // Update high score display
        this.updateHighScoreDisplay();

        // Start the game
        this.generateTrayPieces();
        this.renderTray();

        // Initialize drag controller after tray is rendered
        this.dragController = new DragController(this);
    }

    /**
     * Check if any interaction is allowed
     * @returns {boolean} True if player can interact
     */
    canInteract() {
        return !this.isGameOver && !this.isAnimating;
    }

    /**
     * Handle New Game button click
     */
    handleNewGameClick() {
        // If game is over or no progress, just start new game
        if (this.isGameOver || this.score === 0) {
            this.startNewGame();
        } else {
            // Confirm before resetting mid-game
            if (confirm('Start a new game? Your current progress will be lost.')) {
                this.startNewGame();
            }
        }
    }

    /**
     * Start a completely new game
     */
    startNewGame() {
        // Hide game over modal if showing
        this.hideGameOverModal();

        // Reset game state
        this.grid.reset();
        this.score = 0;
        this.isGameOver = false;
        this.isAnimating = false;

        // Update displays
        this.updateScoreDisplay();
        this.updateHighScoreDisplay();

        // Generate fresh pieces
        this.generateTrayPieces();
        this.renderTray();
    }

    /**
     * Legacy reset method (calls startNewGame)
     */
    reset() {
        this.startNewGame();
    }

    // ============================================
    // HIGH SCORE SYSTEM
    // ============================================

    /**
     * Generate a hash signature for a score to prevent tampering
     * Uses a simple but effective approach mixing score with secret salt
     * @param {number} score - The score to sign
     * @returns {string} Hash signature
     */
    generateScoreHash(score) {
        // Secret salt - obscured to deter casual inspection
        const salt = String.fromCharCode(66, 108, 111, 99, 107, 66, 108, 97, 115, 116, 50, 48, 50, 52);
        const data = `${salt}:${score}:${salt.split('').reverse().join('')}`;

        // Simple hash function (djb2 variant)
        let hash = 5381;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) + hash) ^ data.charCodeAt(i);
            hash = hash >>> 0; // Convert to unsigned 32-bit
        }

        // Convert to base36 for shorter storage
        return hash.toString(36);
    }

    /**
     * Verify a score's hash signature
     * @param {number} score - The score to verify
     * @param {string} hash - The stored hash
     * @returns {boolean} True if valid
     */
    verifyScoreHash(score, hash) {
        return this.generateScoreHash(score) === hash;
    }

    /**
     * Load high score from localStorage
     * @returns {number} Stored high score or 0
     */
    loadHighScore() {
        try {
            const stored = localStorage.getItem('blockblast-highscore');
            if (!stored) return 0;

            // Parse stored data (format: "score:hash")
            const parts = stored.split(':');
            if (parts.length !== 2) return 0;

            const score = parseInt(parts[0], 10);
            const hash = parts[1];

            // Verify integrity
            if (isNaN(score) || !this.verifyScoreHash(score, hash)) {
                // Tampered or corrupted - reset
                localStorage.removeItem('blockblast-highscore');
                return 0;
            }

            return score;
        } catch (e) {
            // localStorage not available
            return 0;
        }
    }

    /**
     * Save high score to localStorage with integrity hash
     * @param {number} score - Score to save
     * @returns {boolean} True if new high score
     */
    saveHighScore(score) {
        try {
            const current = this.loadHighScore();
            if (score > current) {
                const hash = this.generateScoreHash(score);
                localStorage.setItem('blockblast-highscore', `${score}:${hash}`);
                this.highScore = score;
                return true;
            }
            return false;
        } catch (e) {
            // localStorage not available
            return false;
        }
    }

    /**
     * Update high score display in UI
     */
    updateHighScoreDisplay() {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = this.formatNumber(this.highScore);
        }
    }

    // ============================================
    // GAME OVER DETECTION
    // ============================================

    /**
     * Check if any piece from tray can be placed anywhere on the grid
     * @returns {boolean} True if game is over (no valid placements)
     */
    checkGameOver() {
        // Check each piece in the tray
        for (const piece of this.trayPieces) {
            // Skip null pieces (already placed)
            if (!piece) continue;

            // Check if this piece can be placed anywhere
            if (this.canPieceFitAnywhere(piece)) {
                return false; // Found a valid placement, game continues
            }
        }

        // No piece can be placed anywhere
        return true;
    }

    /**
     * Check if a specific piece can fit anywhere on the grid
     * @param {Piece} piece - The piece to check
     * @returns {boolean} True if piece can be placed somewhere
     */
    canPieceFitAnywhere(piece) {
        // Optimization: only check positions where piece could actually fit
        const maxRow = this.grid.size - piece.rows;
        const maxCol = this.grid.size - piece.cols;

        for (let row = 0; row <= maxRow; row++) {
            for (let col = 0; col <= maxCol; col++) {
                if (this.grid.canPlacePiece(piece, row, col)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Trigger game over sequence
     */
    triggerGameOver() {
        this.isGameOver = true;

        // Pause background music
        SoundManager.pauseBackgroundMusic();

        // Check and save high score
        const isNewHighScore = this.saveHighScore(this.score);

        // Play appropriate sound
        if (isNewHighScore) {
            this.playHighScoreSound();
        } else {
            this.playGameOverSound();
        }

        // Update high score display
        this.updateHighScoreDisplay();

        // Show game over modal
        this.showGameOverModal(this.score, isNewHighScore);
    }

    /**
     * Show the game over modal
     * @param {number} finalScore - The final score
     * @param {boolean} isNewHighScore - Whether this is a new high score
     */
    showGameOverModal(finalScore, isNewHighScore) {
        if (!this.gameOverModal) return;

        // Set final score with animation
        if (this.finalScoreElement) {
            this.animateScoreCountUp(this.finalScoreElement, finalScore);
        }

        // Show/hide new high score message
        if (this.newHighScoreMessage) {
            this.newHighScoreMessage.classList.toggle('visible', isNewHighScore);
        }

        // Show modal with animation
        this.gameOverModal.classList.add('visible');
    }

    /**
     * Hide the game over modal
     */
    hideGameOverModal() {
        if (this.gameOverModal) {
            this.gameOverModal.classList.remove('visible');
        }
    }

    /**
     * Animate score counting up from 0
     * @param {HTMLElement} element - Element to update
     * @param {number} targetScore - Final score to reach
     */
    animateScoreCountUp(element, targetScore) {
        const duration = 1000; // 1 second
        const steps = 30;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const animate = () => {
            currentStep++;
            const progress = currentStep / steps;
            // Ease out quad for smoother finish
            const easedProgress = 1 - (1 - progress) * (1 - progress);
            const currentScore = Math.floor(targetScore * easedProgress);

            element.textContent = this.formatNumber(currentScore);

            if (currentStep < steps) {
                setTimeout(animate, stepDuration);
            } else {
                element.textContent = this.formatNumber(targetScore);
            }
        };

        element.textContent = '0';
        setTimeout(animate, stepDuration);
    }

    // ============================================
    // SOUND EFFECTS
    // ============================================

    playPlaceSound() {
        SoundManager.playPlace();
    }

    playClearSound() {
        SoundManager.playClear();
    }

    playComboSound() {
        SoundManager.playCombo();
    }

    async playGameOverSound() {
        await SoundManager.playGameOver();
        SoundManager.playYouLose();
    }

    playHighScoreSound() {
        SoundManager.playHighScore();
    }

    /**
     * Update the sound button visual state
     */
    updateSoundButton() {
        if (this.soundButton) {
            this.soundButton.classList.toggle('muted', !SoundManager.enabled);
        }
    }

    // ============================================
    // PIECE PLACEMENT
    // ============================================

    /**
     * Place a piece on the grid
     * @param {Piece} piece - The piece to place
     * @param {number} gridRow - Target row
     * @param {number} gridCol - Target column
     * @param {number} trayIndex - Index in tray to remove
     */
    async placePiece(piece, gridRow, gridCol, trayIndex) {
        this.isAnimating = true;

        // 1. Fill grid cells with piece color
        const filledCells = piece.getFilledCells();
        const placedCells = [];

        for (const cell of filledCells) {
            const targetRow = gridRow + cell.row;
            const targetCol = gridCol + cell.col;
            this.grid.setCell(targetRow, targetCol, piece.color);
            this.grid.updateCellVisual(targetRow, targetCol);
            placedCells.push({ row: targetRow, col: targetCol });
        }

        // 2. Play place animation
        this.grid.animatePlaceCells(placedCells);
        this.playPlaceSound();

        // 3. Remove piece from tray
        this.removePieceFromTray(trayIndex);

        // 4. Calculate placement score (10 points per cell)
        const placementPoints = filledCells.length * 10;
        this.addScore(placementPoints);

        // 5. Wait for place animation
        await this.delay(150);

        // 6. Check for and clear completed lines
        await this.checkAndClearLines();

        // 7. Check if tray needs refilling (do this BEFORE game over check)
        this.checkAndRefillTray();

        // 8. Check for game over (with current/new pieces)
        if (this.checkGameOver()) {
            this.isAnimating = false;
            this.triggerGameOver();
            return;
        }

        this.isAnimating = false;
    }

    /**
     * Check for completed lines and clear them
     */
    async checkAndClearLines() {
        const completeRows = this.grid.findCompleteRows();
        const completeCols = this.grid.findCompleteCols();

        const totalLines = completeRows.length + completeCols.length;

        if (totalLines === 0) return;

        // Get all cells to clear
        const cellsToClear = this.grid.getCellsToClear(completeRows, completeCols);

        // Play clear animation
        this.grid.animateClearCells(cellsToClear);
        this.playClearSound();

        // Show combo popup if multiple lines
        if (totalLines >= 2) {
            this.showComboPopup(totalLines);
            this.playComboSound();
        }

        // Wait for clear animation
        await this.delay(300);

        // Actually clear the cells
        this.grid.clearCells(cellsToClear);

        // Calculate and award line clear bonus
        const lineBonus = this.calculateLineBonus(totalLines);
        this.addScore(lineBonus);
    }

    /**
     * Calculate bonus points for clearing lines
     * Uses quadratic scaling to reward combos
     * @param {number} lineCount - Number of lines cleared
     * @returns {number} Bonus points
     */
    calculateLineBonus(lineCount) {
        // Quadratic scaling: 500 * n^2
        // 1 line = 500, 2 lines = 2000, 3 lines = 4500, 4 lines = 8000
        return 500 * lineCount * lineCount;
    }

    /**
     * Show combo popup text
     * @param {number} lineCount - Number of lines cleared
     */
    showComboPopup(lineCount) {
        const popup = document.createElement('div');
        popup.className = 'combo-popup';

        // Determine combo text
        let text = '';
        if (lineCount === 2) {
            text = 'Double!';
        } else if (lineCount === 3) {
            text = 'Triple!';
        } else if (lineCount >= 4) {
            text = 'MEGA!';
        }

        popup.textContent = text;

        // Add to game container
        this.gameContainer.appendChild(popup);

        // Trigger animation
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });

        // Remove after animation
        setTimeout(() => {
            popup.classList.add('hide');
            setTimeout(() => popup.remove(), 300);
        }, 800);
    }

    // ============================================
    // TRAY MANAGEMENT
    // ============================================

    /**
     * Remove a piece from the tray after successful placement
     * @param {number} index - Index of piece to remove
     */
    removePieceFromTray(index) {
        // Set the piece to null (keep array structure for proper indexing)
        this.trayPieces[index] = null;

        // Update the visual - hide the piece element
        const pieceElement = this.trayElement.querySelector(
            `.tray-piece[data-index="${index}"]`
        );

        if (pieceElement) {
            // Remove dragging-source first to prevent CSS conflicts
            pieceElement.classList.remove('dragging-source');
            pieceElement.classList.add('placed');

            // Force a reflow to ensure the transition triggers properly
            pieceElement.offsetHeight;
        }
    }

    /**
     * Check if tray is empty and refill if needed
     */
    checkAndRefillTray() {
        // Check if all pieces are null (placed)
        const allPlaced = this.trayPieces.every(piece => piece === null);

        if (allPlaced) {
            this.refillTray();
        }
    }

    /**
     * Generate new pieces and animate them in
     */
    refillTray() {
        // Generate new pieces
        this.generateTrayPieces();

        // Clear and re-render tray with animation
        this.trayElement.innerHTML = '';

        this.trayPieces.forEach((piece, index) => {
            const pieceElement = this.renderPiece(piece);
            pieceElement.dataset.index = index;
            pieceElement.classList.add('entering');
            this.trayElement.appendChild(pieceElement);

            // Stagger the animation
            setTimeout(() => {
                pieceElement.classList.remove('entering');
                pieceElement.classList.add('entered');
            }, 50 + index * 100);
        });
    }

    /**
     * Generate 3 random pieces for the tray
     */
    generateTrayPieces() {
        this.trayPieces = [
            Piece.createRandom(),
            Piece.createRandom(),
            Piece.createRandom()
        ];
    }

    // ============================================
    // SCORING
    // ============================================

    /**
     * Add points to score with animation
     * @param {number} points - Points to add
     */
    addScore(points) {
        this.score += points;
        this.updateScore();

        // Add pulse animation to score
        this.scoreElement.classList.add('score-pulse');
        setTimeout(() => {
            this.scoreElement.classList.remove('score-pulse');
        }, 200);
    }

    /**
     * Update the score display
     */
    updateScoreDisplay() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.formatNumber(this.score);
        }
    }

    /**
     * Legacy method name (calls updateScoreDisplay)
     */
    updateScore() {
        this.updateScoreDisplay();
    }

    /**
     * Format a number with comma separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number string
     */
    formatNumber(num) {
        return num.toLocaleString();
    }

    // ============================================
    // UTILITIES
    // ============================================

    /**
     * Promise-based delay utility
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================
    // RENDERING
    // ============================================

    /**
     * Render a single piece to a container element
     * @param {Piece} piece - The piece to render
     * @returns {HTMLElement} The piece container element
     */
    renderPiece(piece) {
        const container = document.createElement('div');
        container.className = 'tray-piece';

        // Set grid template based on piece dimensions using CSS variable
        container.style.gridTemplateColumns = `repeat(${piece.cols}, var(--piece-cell-size))`;
        container.style.gridTemplateRows = `repeat(${piece.rows}, var(--piece-cell-size))`;

        // Create cells for each position in the piece
        for (let row = 0; row < piece.rows; row++) {
            for (let col = 0; col < piece.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'piece-cell';

                if (piece.shape[row][col] === 1) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = piece.color;
                } else {
                    cell.classList.add('empty');
                }

                container.appendChild(cell);
            }
        }

        return container;
    }

    /**
     * Render all pieces in the tray
     */
    renderTray() {
        this.trayElement.innerHTML = '';

        this.trayPieces.forEach((piece, index) => {
            const pieceElement = this.renderPiece(piece);
            pieceElement.dataset.index = index;
            this.trayElement.appendChild(pieceElement);
        });
    }
}

// ============================================
// INITIALIZATION
// Start the game when the DOM is loaded
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Create global game instance
    window.game = new Game();
});
