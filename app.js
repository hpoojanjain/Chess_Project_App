const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chessInstance = new Chess();

let players = {};
let currentplayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("A user connected", uniquesocket.id);
  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id == players.white) {
      delete players.white;
    } else if (uniquesocket.id == players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chessInstance.turn() == "w" && uniquesocket.id !== players.white)
        return;
      if (chessInstance.turn() == "b" && uniquesocket.id !== players.black)
        return;
      const result = chessInstance.move(move);
      if (result) {
        currentplayer = chessInstance.turn();
        io.emit("move", move);
        io.emit("boardState", chessInstance.fen());
      } else {
        console.log("Invalid Move : ", move);
        uniquesocket.emit("InvalidMove", move);
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("InvalidMove", move);
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
