const status = document.getElementById("status");
const cells = document.querySelectorAll(".cell");
const resetBtn = document.getElementById("reset");

// Connect to Render WebSocket
let ws;
let mySymbol = "";
let myTurn = false;

function connectWebSocket() {
    ws = new WebSocket("wss://tic-tac-toe-server-ifgo.onrender.com/ws");

    ws.onopen = () => {
        console.log("WebSocket connected");
        status.textContent = "Connected. Waiting for opponent...";
    };

    ws.onclose = () => {
        console.log("WebSocket closed, reconnecting in 5s...");
        status.textContent = "Disconnected. Reconnecting...";
        setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = (err) => console.log("WebSocket error:", err);

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if(msg.type === "init") {
            mySymbol = msg.symbol;
            myTurn = msg.turn;
            status.textContent = myTurn ? "Your turn" : "Opponent's turn";
            updateBoard(msg.board);
        }
        else if(msg.type === "update_board") {
            updateBoard(msg.board);
            myTurn = (msg.turn && mySymbol === "X") || (!msg.turn && mySymbol === "O");
            status.textContent = myTurn ? "Your turn" : "Opponent's turn";
        }
        else if(msg.type === "game_over") {
            alert(msg.message);
            updateBoard(["","","","","","","","",""]);
            myTurn = (mySymbol === "X");
            status.textContent = myTurn ? "Your turn" : "Opponent's turn";
        }
        else if(msg.type === "error") {
            alert(msg.message);
        }
    };
}

function updateBoard(board){
    cells.forEach((cell, i) => {
        cell.textContent = board[i];
    });
}

cells.forEach(cell => {
    cell.addEventListener("click", () => {
        const index = cell.dataset.index;
        if(myTurn && cell.textContent === ""){
            ws.send(JSON.stringify({action:"move", index:index}));
        }
    });
});

resetBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({action:"reset"}));
});

// Start WebSocket connection
connectWebSocket();
