# Flight Booking App (React + Flask)

This project consists of a React frontend and a Flask backend.

## Structure
- **backend/**: The Flask application.
- **frontend/**: The React application (Vite).

## Prerequisites
- Node.js installed.
- Python installed.

## Setup Instructions

### 1. Backend
The backend serves the API and is configured to listen on all network interfaces (`0.0.0.0`).
```bash
cd backend
# Install dependencies
pip install flask python-dotenv google-generativeai flask-cors

# Run the server
python app.py
```
The server runs on `http://0.0.0.0:5000` (accessible via localhost and LAN IP).

### 2. Frontend
The frontend is a Vite React app.
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend runs on `http://0.0.0.0:5173`.

## Network Access
To access the app from another device on the same network:
1. Find your computer's local IP address (run `ipconfig` in cmd).
   - Look for "IPv4 Address", e.g., `192.168.1.15`.
2. On your mobile phone or other device, open: `http://<YOUR_IP_ADDRESS>:5173`.
   - Example: `http://192.168.1.15:5173`
3. Ensure both backend and frontend servers are running, and your firewall allows connections to ports 5000 and 5173.
