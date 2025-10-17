const status = document.getElementById("status");
const cells = document.querySelectorAll(".cell");
const resetBtn = document.getElementById("reset");

let ws = new WebSocket(`wss://tic-tac-toe-server-ifgo.onrender.com/ws`);

let mySymbol = "";
let myTurn = false;

ws.onopen = () => console.log("WebSocket connected");
ws.onclose = () => console.log("WebSocket closed");
ws.onerror = (err) => console.log("WebSocket error:", err);

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if(msg.type==="init"){
        mySymbol = msg.symbol;
        myTurn = msg.turn;
        status.textContent = myTurn ? "Your turn" : "Opponent's turn";
        updateBoard(msg.board);
    }
    else if(msg.type==="update_board"){
        updateBoard(msg.board);
        myTurn = (msg.turn && mySymbol==="X") || (!msg.turn && mySymbol==="O");
        status.textContent = myTurn ? "Your turn" : "Opponent's turn";
    }
    else if(msg.type==="game_over"){
        alert(msg.message);
        updateBoard(["","","","","","","","",""]);
        myTurn = (mySymbol==="X");
        status.textContent = myTurn ? "Your turn" : "Opponent's turn";
    }
};

function updateBoard(board){
    cells.forEach((cell,i)=>{
        cell.textContent = board[i];
    });
}

cells.forEach(cell=>{
    cell.addEventListener("click", ()=>{
        const index = cell.dataset.index;
        if(myTurn && cell.textContent===""){
            ws.send(JSON.stringify({action:"move", index:index}));
        }
    });
});

resetBtn.addEventListener("click", ()=>{
    ws.send(JSON.stringify({action:"reset"}));
});
