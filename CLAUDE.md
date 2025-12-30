# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Block Blast is a browser-based puzzle game clone built with vanilla JavaScript, HTML, and CSS. Players drag pieces from a tray onto an 8x8 grid; completing rows or columns clears them for points.

## Running the Game

Serve the files with any static HTTP server:
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080` in a browser.

## Architecture

**Single-page app with three files:**
- `index.html` - Game container structure (grid, tray, score, controls)
- `style.css` - All styling including CSS animations for placement/clearing
- `game.js` - All game logic (~1300 lines)

**Core Classes in game.js:**

| Class | Responsibility |
|-------|----------------|
| `Piece` | Shape/color data, random piece generation via `Piece.createRandom()` |
| `Grid` | 8x8 state array (null=empty, color string=filled), rendering, placement validation, line detection |
| `DragController` | Pointer events for drag-and-drop, ghost preview on grid, touch support with offset |
| `Game` | Main controller: scoring, piece placement flow, line clearing, tray management |

**Key Data Structures:**
- `PIECE_DEFINITIONS` - Object mapping piece type names to `{shape: 2D array, color: string}`
- `Grid.state` - 8x8 2D array where each cell is null or a CSS color string
- `Game.trayPieces` - Array of 3 Piece instances (null when placed)

**Game Flow:**
1. `DragController.handlePointerUp` validates drop position
2. Calls `Game.placePiece()` which fills grid cells and triggers placement animation
3. `Game.checkAndClearLines()` finds complete rows/cols, animates clearing, awards bonus
4. `Game.checkAndRefillTray()` generates new pieces when all 3 are placed

**Animation System:**
- CSS classes trigger animations: `.placing`, `.clearing`, `.placed`, `.entering`
- `Game.isAnimating` flag prevents interaction during animations
- Sound hooks exist but are empty: `playPlaceSound()`, `playClearSound()`, `playComboSound()`

## Scoring

- Placement: 10 points per cell
- Line clear: `500 * lines^2` (1 line = 500, 2 lines = 2000, 3 lines = 4500)

## Not Yet Implemented

- Game over detection (when no pieces can be placed)
- High score persistence
- Sound effects
