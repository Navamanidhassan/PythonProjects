import http.server
import socketserver
import json
import os
import urllib.parse

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
PROFILES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "player_profiles.json")

class SlotMachineRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve from the "web" subdirectory
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/profiles':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if os.path.exists(PROFILES_FILE):
                try:
                    with open(PROFILES_FILE, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except Exception:
                    data = {}
            else:
                data = {}
                
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            # Fallback to serving files
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/profiles':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                profiles = json.loads(post_data.decode('utf-8'))
                with open(PROFILES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(profiles, f, indent=4, ensure_ascii=False)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        # Handle preflight CORS request
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run():
    # Ensure the web directory exists
    os.makedirs(DIRECTORY, exist_ok=True)
    
    server_address = ('', PORT)
    # Allow port reuse to prevent address-already-in-use errors during quick restarts
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(server_address, SlotMachineRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print(f"Serving web directory: {DIRECTORY}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == '__main__':
    run()
