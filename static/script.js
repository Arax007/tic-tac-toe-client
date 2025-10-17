const status = document.getElementById("status");
const cells = document.querySelectorAll(".cell");
const resetBtn = document.getElementById("reset");

// Connect to Render WebSocket
let ws = new WebSocket("wss://tic-tac-toe-server-ifgo.onrender.com/ws");

let mySymbol = "";
let myTurn = false;

// WebSocket events
ws.onopen = () => console.log("WebSocket connected");
ws.onclose = () => console.log("WebSocket closed");
ws.onerror = (err) => console.log("WebSocket error:", err);

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    switch(msg.type) {
        case "init":
            mySymbol = msg.symbol;
            myTurn = msg.turn;
            status.textContent = myTurn ? "Your turn" : "Opponent's turn";
            updateBoard(msg.board);
            break;

        case "update_board":
            updateBoard(msg.board);
            // Determine turn based on symbol and server's turn boolean
            if(mySymbol === "X") myTurn = msg.turn;
            else myTurn = !msg.turn;
            status.textContent = myTurn ? "Your turn" : "Opponent's turn";
            break;

        case "game_over":
            alert(msg.message);
            updateBoard(["","","","","","","","",""]);
            // X always starts first
            myTurn = (mySymbol === "X");
            status.textContent = myTurn ? "Your turn" : "Opponent's turn";
            break;

        case "error":
            alert(msg.message);
            break;
    }
};

// Update the board display
function updateBoard(board){
    cells.forEach((cell, i) => {
        cell.textContent = board[i];
    });
}

// Handle cell clicks
cells.forEach(cell => {
    cell.addEventListener("click", () => {
        const index = parseInt(cell.dataset.index);
        if(myTurn && cell.textContent === ""){
            ws.send(JSON.stringify({action:"move", index:index}));
        }
    });
});

// Handle reset button
resetBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({action:"reset"}));
});
