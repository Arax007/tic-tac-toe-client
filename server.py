from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os
import json

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve HTML
@app.get("/")
async def get():
    with open("index.html", "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

# Health check for uptime monitors
@app.head("/")
async def health_check():
    return {"status": "ok"}

# Game state
players = []
board = [""] * 9
turn_index = 0  # 0 = X, 1 = O

async def broadcast(message: dict):
    for player in players:
        try:
            await player.send_text(json.dumps(message))
        except:
            pass

def check_winner():
    wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ]
    for a,b,c in wins:
        if board[a] == board[b] == board[c] != "":
            return board[a]
    return None

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global turn_index
    await websocket.accept()

    if len(players) >= 2:
        await websocket.send_text(json.dumps({"type":"error","message":"Game full"}))
        await websocket.close()
        return

    players.append(websocket)
    symbol = "X" if len(players) == 1 else "O"
    my_turn = (symbol == "X" and turn_index == 0) or (symbol == "O" and turn_index == 1)

    await websocket.send_text(json.dumps({
        "type": "init",
        "symbol": symbol,
        "turn": my_turn,
        "board": board
    }))

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("action") == "move":
                index = int(msg.get("index", -1))
                if index < 0 or index > 8:
                    continue  # invalid index
                if (turn_index == 0 and symbol == "X") or (turn_index == 1 and symbol == "O"):
                    if board[index] == "":
                        board[index] = symbol
                        turn_index = 1 - turn_index

                        winner = check_winner()
                        if winner:
                            await broadcast({"type":"game_over","message":f"{winner} wins!"})
                            board[:] = [""]*9
                            turn_index = 0
                        elif "" not in board:
                            await broadcast({"type":"game_over","message":"It's a tie!"})
                            board[:] = [""]*9
                            turn_index = 0
                        else:
                            await broadcast({"type":"update_board","board":board,"turn": turn_index==0})

            elif msg.get("action") == "reset":
                board[:] = [""]*9
                turn_index = 0
                await broadcast({"type":"update_board","board":board,"turn": True})

    except WebSocketDisconnect:
        players.remove(websocket)
        print("Client disconnected")
    finally:
        try:
            await websocket.close()
        except:
            pass

# Run Uvicorn with Render's port
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
