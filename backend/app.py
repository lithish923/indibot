from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import google.generativeai as genai
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask_cors import CORS

app = Flask(__name__)
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True
)
app.secret_key = "indigo_secret_key_123" 
# Enable CORS for all domains on all routes, supporting credentials (cookies)
CORS(app,
     supports_credentials=True,
     resources={r"/api/*": {
         "origins": ["https://indibot.vercel.app"]
     }})

# --- CONFIGURATION ---
load_dotenv() # This loads the .env file

# 1. FIXED: Get the key securely
API_KEY = os.getenv("GEMINI_API_KEY")

# Check if key loaded correctly
if not API_KEY:
    print("CRITICAL ERROR: API Key not found. Please create a .env file or hardcode it.")

# 2. FIXED: Use the correct variable name (API_KEY, not GOOGLE_API_KEY)
if API_KEY:
    genai.configure(api_key=API_KEY)
    
    # Use 2.5-flash (1.5 does not exist)
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
    except:
        model = genai.GenerativeModel('gemini-2.5-pro')
else:
    model = None

chat_history = []

import json
from datetime import datetime

# ... imports ...

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  username TEXT UNIQUE NOT NULL, 
                  password TEXT NOT NULL,
                  saved_passengers TEXT)''')
    
    # Check for saved_passengers column
    c.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in c.fetchall()]
    if 'saved_passengers' not in columns:
        c.execute("ALTER TABLE users ADD COLUMN saved_passengers TEXT")

    # Conversations table
    c.execute('''CREATE TABLE IF NOT EXISTS conversations
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT NOT NULL,
                  title TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    # Chats table - Ensure conversation_id exists
    c.execute('''CREATE TABLE IF NOT EXISTS chats
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  conversation_id INTEGER,
                  username TEXT NOT NULL,
                  role TEXT NOT NULL,
                  message TEXT NOT NULL,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    
    # Check if conversation_id exists in chats (for migration)
    c.execute("PRAGMA table_info(chats)")
    columns = [info[1] for info in c.fetchall()]
    if 'conversation_id' not in columns:
        c.execute("ALTER TABLE chats ADD COLUMN conversation_id INTEGER")
                  
    # Bookings table
    c.execute('''CREATE TABLE IF NOT EXISTS bookings
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT NOT NULL,
                  pnr TEXT NOT NULL,
                  flight_no TEXT NOT NULL,
                  origin TEXT NOT NULL,
                  destination TEXT NOT NULL,
                  date TEXT,
                  price TEXT,
                  status TEXT,
                  details TEXT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    # Check for details column
    c.execute("PRAGMA table_info(bookings)")
    columns = [info[1] for info in c.fetchall()]
    if 'details' not in columns:
        c.execute("ALTER TABLE bookings ADD COLUMN details TEXT")

    conn.commit()
    conn.close()

# Initialize DB on start
init_db()

# --- SYSTEM PROMPT ---
SYSTEM_INSTRUCTION = """
You are 'IndiBot', the official AI booking assistant for Indigo Airlines.
Your tone is professional, helpful, and concise.

Your goal is to book a flight by collecting ALL necessary details.

### Booking Process:
1. **Search**: Ask for **Origin**, **Destination**, **Date of Travel**, AND **Travel Class** (Economy/Business).
2. **Options**: Present 3 fictional flight options based on the user's class preference.
   CRITICAL: You MUST return the flight options as a strictly formatted JSON array within a code block:
   ```json
   [
     {
       "id": "1",
       "flight_no": "6E-432",
       "origin": "DEL",
       "destination": "BOM",
       "dep_time": "10:00",
       "arr_time": "12:10",
       "duration": "2h 10m",
       "price": "₹4,500",
       "class": "Economy",
       "type": "Non-stop"
     },
     ...
   ]
   ```

3. **Selection**: Ask user to select a flight.
4. **Details Collection**: Collect:
   - **Passenger**: Name, Gender, Age.
   - **Contact**: Mobile, Email.
   - **Add-ons**: Seat, Meal, Baggage, Insurance.
   
   **IMPORTANT extraction rule**: Users often provide add-ons *with* passenger details.
   Example Input: "1. John Doe, 2. Male, 3. 30, 4. Window Seat, 5. Veg Meal, Insurance yes"
   
   You MUST extract "Window Seat", "Veg Meal", "Insurance" into the `extras` field.
   
   If multiple passengers have different preferences:
   Input: "1. John, Window. 2. Jane, Aisle."
   Output `extras` field: {"seat": "John: Window, Jane: Aisle"}


   
   *Check [User Context] below. If known passengers exist, ASK if the user wants to select one of them.*

5. **Review**: BEFORE asking for payment, generate a summary for review.
   CRITICAL: Return a `review` JSON object:
   ```json
   {
     "status": "review",
     "flight_no": "6E-432",
     "origin": "DEL",
     "destination": "BOM",
     "dep_time": "10:00",
     "arr_time": "12:10",
     "date": "2024-03-20",
     "class": "Economy",
     "passengers": [{"name": "John", "gender": "M", "age": 30}],
     "contact": {"mobile": "...", "email": "..."},
     "extras": {"seat": "...", "meal": "..."},
     "total_price": "₹9,000"
   }
   ```
   **CRITICAL CALCULATION RULE**: `total_price` MUST be `price_per_person` multiplied by the `number_of_passengers`. Do NOT just copy the single ticket price.
   Ask the user to confirm these details.

6. **Payment**: If user confirms, Request Payment.
   CRITICAL: Return a `payment_request` JSON object:
   ```json
   {
     "status": "payment_request",
     "amount": "₹4,500"
   }
   ```
   Wait for the user/system to respond with "Payment Successful".

7. **Confirmation**: After successful payment, generate the final booking booking confirmation.
   CRITICAL: Return a `confirmed` JSON object:
   ```json
   {
     "status": "confirmed",
     "pnr": "IND123456",
     "flight_no": "6E-432",
     "origin": "DEL",
     "destination": "BOM",
     "date": "2024-03-20",
     "price": "₹4,500",
     "passengers": [...],
     "contact": {...},
     "extras": {...},
     "payment": {"method": "UPI", "status": "Paid"}
   }
   ```
   
IMPORTANT: Do not actually book. Keep responses short. use 24h format for internal logic but 12h for display if needed.

### Modification Process:
If the user requests to modify an existing booking (e.g., change date, change passenger):
1. **Confirm**: Confirm their existing PNR (it will be provided in [User Context]) and what they want to change.
2. **Quote Fee**: Calculate a fictional Fare Difference + Change fee (e.g. ₹2,000) and tell the user. Ask if they want to proceed.
3. **Payment**: Generate a `payment_request` JSON for the fee:
   ```json
   {
     "status": "payment_request",
     "amount": "₹2,000"
   }
   ```
4. **Modified Confirmation**: Once paid, return a `modified` JSON object EXACTLY like this:
   ```json
   {
     "status": "modified",
     "pnr": "THE_EXISTING_PNR",
     "flight_no": "...",
     "origin": "...",
     "destination": "...",
     "date": "NEW_DATE",
     "price": "...",
     "passengers": [...],
     "contact": {...},
     "extras": {...},
     "payment": {"method": "UPI", "status": "Paid (Modification)"}
   }
   ```
"""

# ... ROUTES ...

@app.route('/')
def home():
    return jsonify({"message": "Backend is running. Use the frontend to interact."})

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'username' in session:
        return jsonify({"authenticated": True, "username": session['username']})
    return jsonify({"authenticated": False}), 401

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password_hash(user[2], password):
        session['username'] = username
        session.pop('conversation_id', None) # Clear conversation on login
        return jsonify({"success": True, "message": "Login successful", "username": username})
    else:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400

    hashed_password = generate_password_hash(password)
    
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Registration successful! Please login."})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Username already exists."}), 409
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    session.pop('conversation_id', None)
    return jsonify({"success": True, "message": "Logged out"})

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    username = session['username']
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM bookings WHERE username = ? ORDER BY timestamp DESC", (username,))
    rows = c.fetchall()
    conn.close()
    
    bookings = [dict(row) for row in rows]
    return jsonify({"bookings": bookings})

@app.route('/api/history', methods=['GET'])
def get_conversations():
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    username = session['username']
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    # Get conversations that actually have messages (cleanup empty ones)
    query = """
        SELECT DISTINCT c.* 
        FROM conversations c 
        JOIN chats ch ON c.id = ch.conversation_id 
        WHERE c.username = ? 
        ORDER BY c.created_at DESC
    """
    c.execute(query, (username,))
    rows = c.fetchall()
    conn.close()
    
    conversations = [dict(row) for row in rows]
    return jsonify({"conversations": conversations})

@app.route('/api/history/<int:conversation_id>', methods=['GET'])
def get_conversation_messages(conversation_id):
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    username = session['username']
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Verify ownership
    c.execute("SELECT * FROM conversations WHERE id = ? AND username = ?", (conversation_id, username))
    if not c.fetchone():
        conn.close()
        return jsonify({"error": "Conversation not found or unauthorized"}), 404

    c.execute("SELECT * FROM chats WHERE conversation_id = ? ORDER BY timestamp ASC", (conversation_id,))
    rows = c.fetchall()
    conn.close()
    
    messages = [dict(row) for row in rows]
    return jsonify({"messages": messages})

@app.route('/api/chat/new', methods=['POST'])
def new_chat():
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Lazy creation: Just clear the session ID. 
    # The actual row will be created when the first message is sent.
    session.pop('conversation_id', None)
    
    return jsonify({"success": True, "message": "New chat context ready"})

@app.route('/api/chat/current', methods=['GET'])
def current_chat():
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    conversation_id = session.get('conversation_id')
    if not conversation_id:
        return jsonify({"messages": []})
        
    username = session['username']
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM chats WHERE conversation_id = ? AND username = ? ORDER BY timestamp ASC", (conversation_id, username))
    rows = c.fetchall()
    conn.close()
    
    messages = [dict(row) for row in rows]
    return jsonify({"messages": messages, "conversation_id": conversation_id})

@app.route('/api/chat/continue', methods=['POST'])
def continue_chat():
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json()
    conversation_id = data.get('conversation_id')
    
    if not conversation_id:
        return jsonify({"error": "Missing conversation_id"}), 400
        
    username = session['username']
    
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT id FROM conversations WHERE id = ? AND username = ?", (conversation_id, username))
    if not c.fetchone():
        conn.close()
        return jsonify({"error": "Conversation not found or unauthorized"}), 404
    conn.close()
    
    session['conversation_id'] = conversation_id
    return jsonify({"success": True, "message": "Conversation context restored"})

@app.route("/api/chat", methods=["POST"])
def chat():
    # Protect the API route too
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_message = request.json.get("message")
    req_conversation_id = request.json.get("conversation_id")
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    
    if not model:
        return jsonify({"error": "AI Model not configured"}), 500

    username = session['username']
    
    # 1. Get Conversation ID
    conversation_id = req_conversation_id or session.get('conversation_id')
    
    # 2. Prepare Context (History + Saved Passengers)
    saved_passengers = []
    history_rows = []
    
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Fetch Saved Passengers
    try:
        c.execute("SELECT saved_passengers FROM users WHERE username = ?", (username,))
        user_row = c.fetchone()
        if user_row and user_row['saved_passengers']:
            saved_passengers = json.loads(user_row['saved_passengers'])
    except Exception as e:
        print(f"Error fetching saved passengers: {e}")
        saved_passengers = []

    # Fetch Active Bookings
    try:
        c.execute("SELECT pnr, flight_no, origin, destination, date, details FROM bookings WHERE username = ? AND status = 'confirmed'", (username,))
        active_bookings = [dict(row) for row in c.fetchall()]
    except Exception as e:
        print(f"Error fetching bookings: {e}")
        active_bookings = []

    # Fetch History if conversation exists
    if conversation_id:
        c.execute("SELECT role, message FROM chats WHERE conversation_id = ? ORDER BY timestamp ASC", (conversation_id,))
        history_rows = c.fetchall()
        
    conn.close()

    # 3. Build Messages for AI
    context_str = "\\n[User Context]\\n"
    if saved_passengers:
        names = [p.get('name', 'Unknown') for p in saved_passengers]
        context_str += f"Known Passengers: {', '.join(names)}. Ask if they want to use these details.\\n"
    
    if active_bookings:
        bookings_summary = []
        for b in active_bookings:
            try:
                p_len = len(json.loads(b['details']).get('passengers', []))
            except:
                p_len = 0
            bookings_summary.append(f"PNR: {b['pnr']} | Flight: {b['flight_no']} | Date: {b['date']} | Route: {b['origin']}->{b['destination']} | PassengersCount: {p_len}")
        context_str += f"Confirmed Bookings: {'; '.join(bookings_summary)}. Use this to help modify bookings.\\n"
    messages = [{"role": "user", "parts": [SYSTEM_INSTRUCTION + context_str]},
                {"role": "model", "parts": ["Understood. I am IndiBot."]}]
    
    for row in history_rows:
        role = "model" if row['role'] == "model" else "user"
        messages.append({"role": role, "parts": [row['message']]})
    
    messages.append({"role": "user", "parts": [user_message]})
    
    # 4. Generate AI Response
    import time
    import re
    
    max_retries = 2
    retries = 0
    bot_reply = ""
    while retries < max_retries:
        try:
            response = model.generate_content(messages)
            bot_reply = response.text
            break
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "Quota exceeded" in err_str:
                match = re.search(r'retry in ([\d\.]+)s', err_str)
                wait_time = float(match.group(1)) + 1 if match else 60
                print(f"Rate limited. Waiting {wait_time}s before retrying ({retries+1}/{max_retries})...")
                time.sleep(wait_time)
                retries += 1
            else:
                print(f"AI Generation Error: {e}")
                return jsonify({"error": "Failed to generate response", "details": err_str}), 500
    else:
        return jsonify({"error": "Rate limit exceeded and retries exhausted. Please try again later."}), 500

    # 5. Save to DB (Lazy Creation)
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        
        # Create conversation if it doesn't exist (Lazy)
        is_new_conversation = False
        if not conversation_id:
            c.execute("INSERT INTO conversations (username, title) VALUES (?, ?)", (username, user_message[:30] + "..."))
            conversation_id = c.lastrowid
            session['conversation_id'] = conversation_id
            is_new_conversation = True
        
        # Save messages
        c.execute("INSERT INTO chats (conversation_id, username, role, message) VALUES (?, ?, ?, ?)", 
                  (conversation_id, username, 'user', user_message))
        c.execute("INSERT INTO chats (conversation_id, username, role, message) VALUES (?, ?, ?, ?)", 
                  (conversation_id, username, 'model', bot_reply))
        
        # Update title if new
        if is_new_conversation:
             c.execute("UPDATE conversations SET title = ? WHERE id = ?", (user_message[:30] + "...", conversation_id))

        # 6. Check for Booking Confirmation (Full JSON)
        import re
        print(f"DEBUG: Bot Reply: {bot_reply}") # Debugging
        
        # Capture content inside ```json ... ```
        json_match = re.search(r'```json\s*(.*?)\s*```', bot_reply, re.DOTALL)
        
        if json_match:
            try:
                booking_json_str = json_match.group(1).strip()
                print(f"DEBUG: Extracted JSON String: {booking_json_str}")
                
                booking_data = json.loads(booking_json_str)
                
                # Verify status is confirmed (if we matched a generic JSON block)
                if booking_data.get('status') == 'confirmed':
                    print("DEBUG: Status is confirmed. Saving to DB...")
                    # Extract main fields for columns
                    flight_no = booking_data.get('flight_no', 'N/A')
                    pnr = booking_data.get('pnr', 'N/A')
                    origin = booking_data.get('origin', 'Unknown')
                    destination = booking_data.get('destination', 'Unknown')
                    date = booking_data.get('date', 'Unknown')
                    price = booking_data.get('price', 'Unknown')
                    
                    # Save full JSON to 'details' column
                    # Ensure booking_json_str is valid string
                    c.execute('''INSERT INTO bookings (username, pnr, flight_no, origin, destination, date, price, status, details)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                                 (username, pnr, flight_no, origin, destination, date, price, 'confirmed', booking_json_str))
                             
                    # Update Saved Passengers
                    new_passengers = booking_data.get('passengers', [])
                    updated_saved = saved_passengers.copy()
                    
                    for np in new_passengers:
                        # Check if name exists
                        if not any(sp.get('name') == np.get('name') for sp in updated_saved):
                            updated_saved.append(np)
                    
                    c.execute("UPDATE users SET saved_passengers = ? WHERE username = ?", 
                              (json.dumps(updated_saved), username))
                    
                    print("DEBUG: Booking saved successfully")
                elif booking_data.get('status') == 'modified':
                    print("DEBUG: Status is modified. Updating DB...")
                    flight_no = booking_data.get('flight_no', 'N/A')
                    pnr = booking_data.get('pnr', 'N/A')
                    origin = booking_data.get('origin', 'Unknown')
                    destination = booking_data.get('destination', 'Unknown')
                    date = booking_data.get('date', 'Unknown')
                    price = booking_data.get('price', 'Unknown')
                    
                    c.execute('''UPDATE bookings SET
                                 flight_no = ?, origin = ?, destination = ?, date = ?, price = ?, details = ?
                                 WHERE pnr = ? AND username = ?''',
                                 (flight_no, origin, destination, date, price, booking_json_str, pnr, username))
                    print("DEBUG: Booking modified successfully")
                else:
                     print(f"DEBUG: JSON found but status is {booking_data.get('status')}")

            except Exception as e:
                print(f"FAILED to auto-save booking: {e}")
                import traceback
                traceback.print_exc()
        else:
             print("DEBUG: No JSON code block found in response.")

        conn.commit()
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()
        
    return jsonify({"response": bot_reply, "conversation_id": conversation_id})

if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')