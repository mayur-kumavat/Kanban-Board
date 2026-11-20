const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Board = require("./models/Board");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "http://localhost:5173" },
  });

  // Runs once when a browser tries to connect: check the token
  io.use((socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("board:join", async (boardId) => {
      try {
        const board = await Board.findOne({ _id: boardId, members: socket.userId });
        if (board) socket.join(`board:${boardId}`);
      } catch (err) {
        // ignore bad ids
      }
    });

    socket.on("board:leave", (boardId) => {
      socket.leave(`board:${boardId}`);
    });
  });

  return io;
}

// Call this from any route after it changes a board
function notifyBoard(req, boardId) {
  const io = req.app.get("io");
  if (!io) return;
  let target = io.to(`board:${boardId}`);
  const senderSocketId = req.headers["x-socket-id"];
  if (senderSocketId) target = target.except(senderSocketId); // don't notify the person who made the change
  target.emit("board:changed");
}

module.exports = { initSocket, notifyBoard };