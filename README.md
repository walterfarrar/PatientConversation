# Medical Consultation Simulator

An interactive web-based medical consultation simulator that demonstrates a branching dialogue system. The application simulates a doctor-patient conversation with multiple paths, test ordering capabilities, and dynamic dialogue branching based on previous choices.

## Features

- Branching dialogue system with multiple conversation paths
- Medical test ordering and results viewing
- Dynamic path selection based on conversation history
- Alternative dialogue paths when revisiting previously discussed topics
- Simple and intuitive user interface

## Setup

1. Clone the repository
2. Open the project directory
3. Start a local server (e.g., using Python's `http.server`):
   ```bash
   python -m http.server 8000
   ```
4. Open your browser and navigate to `http://localhost:8000`

## Project Structure

- `index.html` - Main HTML file
- `styles.css` - CSS styles
- `script.js` - Main JavaScript application code
- `conversation-data.json` - Dialogue tree and test data

## Usage

The application simulates a medical consultation where you play the role of a doctor. You can:
- Choose different dialogue options
- Order medical tests
- View test results
- Navigate through different conversation branches

The system remembers your choices and adapts the dialogue accordingly, providing alternative paths when revisiting previously discussed topics. 