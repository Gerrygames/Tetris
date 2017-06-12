import http.server
import socketserver

PORT = 80

Handler = http.server.SimpleHTTPRequestHandler;
m = http.server.SimpleHTTPRequestHandler.extensions_map;
m[''] = 'text/plain';
for k, v in m.items(): m[k] = v + ';charset=UTF-8';

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()