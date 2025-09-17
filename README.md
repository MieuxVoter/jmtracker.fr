# jmtracker.fr

## How to Launch the App Server

### Prerequisites
- Python (version 3.6 or higher)

### Quick Start
1. Navigate to the project directory:
   ```bash
   cd /path/to/project
   ```

2. Start the Python HTTP server:
   ```bash
   python -m http.server 8000
   ```

3. Open [http://localhost:8000](http://localhost:8000) in your browser

### Production
For a more robust production server:
```bash
python -m http.server 8000 --bind 0.0.0.0
```
python manage.py runserver 0.0.0.0:8000
```
