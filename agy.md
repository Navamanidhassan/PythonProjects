# Premium Python Slot Machine Game

A terminal-based slot machine simulation game written in Python featuring rich formatting, spin animations, emoji themes, session statistics, and local JSON profile persistence.

---

## Project Structure

- **[Slot machine python project/main.py](file:///C:/Users/navam/PycharmProjects/PythonProject/Slot%20machine%20python%20project/main.py)**: The main entry point and source code containing game logic, interactive menus, layout rendering, and profile storage.
- **`Slot machine python project/player_profiles.json`**: Auto-generated file storing player balances and session stats.

---

## 💎 Premium Features

1. **Terminal Colors**: High-contrast, clean UI styling utilizing standard ANSI escape sequences for text colors (green for wins, red for losses/errors, yellow for headers).
2. **Reel Spin Animation**: A visual ease-out spinning animation where random symbols flash and slow down gradually, simulating a real casino slot machine.
3. **Emoji Reels**: Uses high-definition emojis instead of plain characters:
   - `💎` (Diamond) — Jackpot / Payout: 5x
   - `🔔` (Bell) — Payout: 4x
   - `🍋` (Lemon) — Payout: 3x
   - `🍒` (Cherry) — Payout: 2x
4. **Session Stats Tracker**: Real-time stats are tracked during gameplay and can be viewed inside a dedicated dashboard menu:
   - Total Spins
   - Win Rate (%)
   - Total Amount Bet
   - Total Amount Won
   - Net Profit/Loss (dynamic green/red highlights)
   - Biggest Single Win
5. **Interactive Main Menu**:
   - `1. Spin the Slots`
   - `2. View Rules & Payouts`
   - `3. View Session Statistics`
   - `4. Deposit More Funds`
   - `5. Change Profile / Log Out`
   - `6. Save & Quit`

---

## 💾 Profile Persistence & JSON Storage

Game state is persisted to a local `player_profiles.json` file stored in the script's directory. 

### Data Scheme

```json
{
    "Alice": {
        "balance": 500,
        "stats": {
            "total_spins": 12,
            "total_won": 140,
            "total_bet": 120,
            "biggest_win": 60,
            "rounds_won": 3
        }
    },
    "Bob": {
        "balance": 1000,
        "stats": {
            "total_spins": 0,
            "total_won": 0,
            "total_bet": 0,
            "biggest_win": 0,
            "rounds_won": 0
        }
    }
}
```

### Launch Sequence
1. Upon execution, the game loads all stored accounts from `player_profiles.json`.
2. The player is prompted to choose an existing profile (listing balances), create a new profile with an initial deposit, or exit.
3. Game states (balances and statistics) are automatically saved to `player_profiles.json` after every spin, deposit, profile logout, and exit.

---

## 🛠️ Code Fixes Applied

### 1. Indentation Bug in `check_winnings`
The logic error in [main.py](file:///C:/Users/navam/PycharmProjects/PythonProject/Slot%20machine%20python%20project/main.py) where symbol checking was placed outside the line iteration loop has been fully corrected. The checking loop is now correctly nested inside the line loop:

```python
def check_winnings(columns, lines, bet, values):
    winnings = 0
    winning_lines = []
    for line in range(lines):
        symbol = columns[0][line]
        for column in columns:
            symbol_to_check = column[line]
            if symbol_to_check != symbol:
                break
        else:
            winnings += values[symbol] * bet
            winning_lines.append(line + 1)
            
    return winnings, winning_lines
```

### 2. Auto-ANSI Escape Support on Windows
Added `os.system("")` on launch within `main()` to ensure that ANSI escape codes (colors and cursor movement animations) render correctly on legacy Windows command prompts.

---

## How to Run

Open your terminal, navigate to the root directory of the project, and run:

```bash
python "Slot machine python project/main.py"
```
