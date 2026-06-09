import random
import time
import os
import json
import sys

# Reconfigure stdout and stderr to use UTF-8 to support emojis on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding='utf-8')


# Configuration Constants
MAX_LINES = 3
MAX_BET = 100
MIN_BET = 1
ROWS = 3
COLS = 3

# File path for storing profiles
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILES_FILE = os.path.join(SCRIPT_DIR, "player_profiles.json")

# Emojis for symbols
symbol_count = {
    '💎': 2,   # Diamond (Jackpot / Rarest)
    '🔔': 4,   # Bell
    '🍋': 6,   # Lemon
    '🍒': 8    # Cherry (Common)
}

symbol_value = {
    '💎': 5,   # Payout multiplier
    '🔔': 4,
    '🍋': 3,
    '🍒': 2
}

# ANSI Escape Codes for CLI Colors
RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"
WHITE = "\033[37m"
CLEAR_LINE = "\033[K"

def load_profiles():
    if not os.path.exists(PROFILES_FILE):
        return {}
    try:
        with open(PROFILES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def save_profiles(profiles):
    try:
        with open(PROFILES_FILE, 'w', encoding='utf-8') as f:
            json.dump(profiles, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"{RED}Error saving profile data: {e}{RESET}")

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

def get_slot_machine_spin(rows, cols, symbols):
    all_symbols = []
    for symbol, sym_count in symbols.items():
        for _ in range(sym_count):
            all_symbols.append(symbol)
            
    columns = []
    for _ in range(cols):
        current_symbols = all_symbols[:]
        column = []
        for _ in range(rows):
            value = random.choice(current_symbols)
            current_symbols.remove(value)
            column.append(value)
        columns.append(column)
        
    return columns

def print_slot_machine(columns) -> None:
    num_rows = len(columns[0])
    for row in range(num_rows):
        print(CLEAR_LINE, end="")
        for i, column in enumerate(columns):
            value = column[row]
            if i != len(columns) - 1:
                print(f" {value} ", end="|")
            else:
                print(f" {value} ", end="")
        print()

def spin_animation(rows, cols, symbols):
    print(f"\n{BOLD}{YELLOW}🎰 SPINNING THE REELS... 🎰{RESET}")
    for _ in range(rows):
        print()
        
    for frame in range(12):
        print(f"\033[{rows}A", end="")
        temp_slots = get_slot_machine_spin(rows, cols, symbols)
        print_slot_machine(temp_slots)
        time.sleep(0.04 + (frame * 0.02))

def deposit() -> int:
    while True:
        amount = input(f"{BOLD}{CYAN}How much is the amount you wanna deposit? ${RESET}")
        if amount.isdigit():
            amount = int(amount)
            if amount > 0:
                print(f"{GREEN}Successfully deposited ${amount}!{RESET}")
                break
            else:
                print(f"{RED}Amount must be greater than 0.{RESET}")
        else:
            print(f"{RED}Please enter a positive number.{RESET}")
    return amount

def get_number_of_lines() -> int:
    while True:
        lines = input(f"How many lines do you want to bet on (1 to {MAX_LINES})? ")
        if lines.isdigit():
            lines = int(lines)
            if 1 <= lines <= MAX_LINES:
                break
            else:
                print(f"{RED}Enter a valid number of lines (1-{MAX_LINES}){RESET}")
        else:
            print(f"{RED}Enter a valid integer.{RESET}")
    return lines

def get_bet() -> int:
    while True:
        bet = input(f"How much do you want to bet per line (${MIN_BET} - ${MAX_BET})? $")
        if bet.isdigit():
            bet = int(bet)
            if MIN_BET <= bet <= MAX_BET:
                break
            else:
                print(f"{RED}Bet must be between ${MIN_BET} and ${MAX_BET}.{RESET}")
        else:
            print(f"{RED}Please enter a valid number.{RESET}")
    return bet

def display_rules():
    print(f"\n{BOLD}{YELLOW}📜 SLOT MACHINE RULES & PAYOUTS 📜{RESET}")
    print("┌──────────────────────────────────────────────┐")
    print(f"│ {CYAN}Symbol{RESET}   │ {CYAN}Occurrence Count{RESET} │ {CYAN}Multiplier Value{RESET} │")
    print("├──────────────────────────────────────────────┤")
    for symbol in symbol_count:
        count = symbol_count[symbol]
        value = symbol_value[symbol]
        print(f"│   {symbol}    │        {count}       │        {value}x        │")
    print("└──────────────────────────────────────────────┘")
    print("• You win if all symbols in a betted row match.")
    print("• Winnings are calculated as: multiplier * bet per line.")
    print("• Betting on multiple lines checks horizontal rows from top to bottom.")
    input(f"\n{BLUE}Press Enter to return to the menu...{RESET}")

def display_stats(stats):
    print(f"\n{BOLD}{CYAN}📊 YOUR SESSION STATISTICS 📊{RESET}")
    print("┌──────────────────────────────────────────┐")
    print(f"│  Total Spins:   {stats['total_spins']:<25}│")
    
    win_rate = 0.0
    if stats['total_spins'] > 0:
        win_rate = (stats['rounds_won'] / stats['total_spins']) * 100
        
    print(f"│  Win Rate:      {f'{win_rate:.1f}%':<25}│")
    print(f"│  Total Bet:     {f'${stats['total_bet']}':<25}│")
    print(f"│  Total Won:     {f'${stats['total_won']}':<25}│")
    
    net_profit = stats['total_won'] - stats['total_bet']
    profit_color = GREEN if net_profit >= 0 else RED
    sign = "+" if net_profit >= 0 else ""
    profit_str = f"{sign}${net_profit}"
    
    print(f"│  Net Profit:    {profit_color}{profit_str:<25}{RESET}│")
    print(f"│  Biggest Win:   {f'${stats['biggest_win']}':<25}│")
    print("└──────────────────────────────────────────┘")
    input(f"\n{BLUE}Press Enter to return to the menu...{RESET}")

def play_round(balance, stats) -> int:
    lines = get_number_of_lines()
    while True:
        bet = get_bet()
        total_bet = bet * lines
        if balance < total_bet:
            print(f"{RED}You do not have enough funds. Current balance: ${balance} (Required: ${total_bet}){RESET}")
            choice = input("Would you like to deposit more funds? (y/n): ").lower()
            if choice == 'y':
                balance += deposit()
            else:
                return balance
        else:
            break
            
    print(f"\nBetting {GREEN}${bet}{RESET} on {YELLOW}{lines}{RESET} line(s). Total bet: {RED}${total_bet}{RESET}")
    
    spin_animation(ROWS, COLS, symbol_count)
    
    slots = get_slot_machine_spin(ROWS, COLS, symbol_count)
    
    print(f"\033[{ROWS}A", end="")
    print_slot_machine(slots)
    
    winnings, winning_lines = check_winnings(slots, lines, bet, symbol_value)
    
    stats['total_spins'] += 1
    stats['total_bet'] += total_bet
    stats['total_won'] += winnings
    if winnings > stats['biggest_win']:
        stats['biggest_win'] = winnings
        
    if winnings > 0:
        stats['rounds_won'] += 1
        print(f"\n{BOLD}{GREEN}🎉 YOU WON ${winnings}! 🎉{RESET}")
        print(f"Winning line(s): {', '.join(map(str, winning_lines))}")
    else:
        print(f"\n{RED}No winning combinations on your lines.{RESET}")
        
    new_balance = balance - total_bet + winnings
    print(f"New Balance: {GREEN}${new_balance}{RESET}")
    return new_balance

def select_profile(profiles):
    while True:
        print(f"\n{BOLD}{CYAN}👥 SELECT PLAYER PROFILE 👥{RESET}")
        print("1. Select existing profile")
        print("2. Create new profile")
        print("3. Quit")
        
        choice = input(f"{BOLD}Choose an option (1-3): {RESET}").strip()
        
        if choice == '1':
            if not profiles:
                print(f"{RED}No profiles found. Please create one first.{RESET}")
                continue
            
            print(f"\n{BOLD}{CYAN}Existing Profiles:{RESET}")
            profile_list = list(profiles.keys())
            for idx, name in enumerate(profile_list, 1):
                balance = profiles[name].get("balance", 0)
                print(f"{idx}. {name} (Balance: ${balance})")
            
            p_choice = input(f"Select profile (1-{len(profile_list)}) or 'b' to go back: ").strip()
            if p_choice.lower() == 'b':
                continue
            if p_choice.isdigit():
                p_idx = int(p_choice) - 1
                if 0 <= p_idx < len(profile_list):
                    profile_name = profile_list[p_idx]
                    profile_data = profiles[profile_name]
                    # Ensure stats exist
                    stats = profile_data.get("stats", {
                        "total_spins": 0,
                        "total_won": 0,
                        "total_bet": 0,
                        "biggest_win": 0,
                        "rounds_won": 0
                    })
                    # Make sure all required keys are in stats (migration safety)
                    for key in ["total_spins", "total_won", "total_bet", "biggest_win", "rounds_won"]:
                        if key not in stats:
                            stats[key] = 0
                    return profile_name, profile_data.get("balance", 0), stats
            print(f"{RED}Invalid selection.{RESET}")
            
        elif choice == '2':
            name = input("Enter new profile name: ").strip()
            if not name:
                print(f"{RED}Name cannot be empty.{RESET}")
                continue
            if name in profiles:
                print(f"{RED}Profile name already exists.{RESET}")
                continue
            
            print(f"{GREEN}Creating profile for '{name}'...{RESET}")
            initial_deposit = deposit()
            profiles[name] = {
                "balance": initial_deposit,
                "stats": {
                    "total_spins": 0,
                    "total_won": 0,
                    "total_bet": 0,
                    "biggest_win": 0,
                    "rounds_won": 0
                }
            }
            save_profiles(profiles)
            return name, initial_deposit, profiles[name]["stats"]
            
        elif choice == '3':
            print(f"\n{BOLD}{YELLOW}Goodbye!{RESET}\n")
            exit(0)
        else:
            print(f"{RED}Invalid choice.{RESET}")

def main() -> None:
    os.system("")
    
    print(f"{BOLD}{YELLOW}🎰 WELCOME TO THE PREMIUM SLOT MACHINE GAME! 🎰{RESET}")
    
    profiles = load_profiles()
    profile_name, balance, stats = select_profile(profiles)
    
    while True:
        print(f"\n{BOLD}{BLUE}======================================={RESET}")
        print(f" Player: {YELLOW}{profile_name}{RESET} | Balance: {GREEN}${balance}{RESET}")
        print(f"{BOLD}{BLUE}======================================={RESET}")
        print(f"1. 🎰 {BOLD}Spin the Slots{RESET}")
        print(f"2. 📜 View Rules & Payouts")
        print(f"3. 📊 View Session Statistics")
        print(f"4. 💵 Deposit More Funds")
        print(f"5. 👥 Change Profile / Log Out")
        print(f"6. 🚪 Save & Quit")
        print(f"{BOLD}{BLUE}======================================={RESET}")
        
        choice = input(f"{BOLD}Choose an option (1-6): {RESET}").strip()
        
        if choice == '1':
            if balance <= 0:
                print(f"{RED}Your balance is $0! Please deposit more funds to continue playing.{RESET}")
                continue
            balance = play_round(balance, stats)
            
            # Save progress
            profiles[profile_name]["balance"] = balance
            profiles[profile_name]["stats"] = stats
            save_profiles(profiles)
            
        elif choice == '2':
            display_rules()
        elif choice == '3':
            display_stats(stats)
        elif choice == '4':
            added_deposit = deposit()
            balance += added_deposit
            
            # Save progress
            profiles[profile_name]["balance"] = balance
            save_profiles(profiles)
            
        elif choice == '5':
            # Save current profile progress first
            profiles[profile_name]["balance"] = balance
            profiles[profile_name]["stats"] = stats
            save_profiles(profiles)
            
            # Switch profile
            profiles = load_profiles()
            profile_name, balance, stats = select_profile(profiles)
            
        elif choice == '6':
            profiles[profile_name]["balance"] = balance
            profiles[profile_name]["stats"] = stats
            save_profiles(profiles)
            break
        else:
            print(f"{RED}Invalid option. Please choose between 1 and 6.{RESET}")
            
    print(f"\n{BOLD}{YELLOW}💰 Cashing out... You left with ${balance}. Thank you for playing! 💰{RESET}\n")

if __name__ == '__main__':
    main()