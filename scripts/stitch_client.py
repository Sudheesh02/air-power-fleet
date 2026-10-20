import os
import json
import urllib.request
import urllib.error
import sys

API_KEY = os.environ.get("STITCH_API_KEY", "")
ENDPOINT = "https://stitch.googleapis.com/mcp"

def call_stitch_tool(tool_name: str, arguments: dict = None):
    if arguments is None:
        arguments = {}
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "X-Goog-Api-Key": API_KEY
    }
    
    req = urllib.request.Request(ENDPOINT, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            res_data = response.read().decode("utf-8")
            # Parse response
            # Note: response may be JSON-RPC or SSE
            lines = res_data.strip().split("\n")
            json_text = ""
            for line in lines:
                if line.startswith("data: "):
                    json_text = line[6:]
                elif line.startswith("{"):
                    json_text = line
            
            if not json_text:
                json_text = res_data
                
            parsed = json.loads(json_text)
            return parsed
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"HTTPError {e.code}: {error_body}", file=sys.stderr)
        return {"error": error_body}
    except Exception as e:
        print(f"Exception: {str(e)}", file=sys.stderr)
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python stitch_client.py <tool_name> [args_json_or_key=val...]")
        sys.exit(1)
        
    tool = sys.argv[1]
    args = {}
    if len(sys.argv) > 2:
        arg_str = " ".join(sys.argv[2:])
        try:
            args = json.loads(arg_str)
        except Exception:
            # Try parsing key=value pairs
            for a in sys.argv[2:]:
                if "=" in a:
                    k, v = a.split("=", 1)
                    args[k.strip()] = v.strip()
    result = call_stitch_tool(tool, args)
    print(json.dumps(result, indent=2))
