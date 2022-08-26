const path = require("path");
const http = require("http");
const express = require("express");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = "Chat Bot";
// set static folder
app.use(express.static(path.join(__dirname, "public")));

//run when a client connects;

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    //   emit to single client
    socket.emit("message", formatMessage(botName, "welcome to chatcord"));

    //broadcast when a user connects
    // emit to all clients except the one that is connecting
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat `)
      );
    //send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //   listen for chat message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
    console.log(msg);
  });

  //   when clinet disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      // emit to all clients
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});
const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
