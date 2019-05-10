module.exports = class AppServer {
  // Socket.io 등 관련 모듈 초기화
  constructor(_app) {
    this.app = _app;
    this.http = require("http").Server(_app);
    this.io = require("socket.io")(this.http);
  }

  // 기본 라우팅
  routing() {
    this.app.get("/room", (req, res) => {
      // 접속할 방 번호가 없는 경우 체크
      if (req.query.key === undefined || req.query.key.length === 0) {
        // 랜덤을 통해 임의의 방을 만들어 리다이렉션 시킨다.
        var ids = Math.floor(Math.random() * (9999 - 1000)) + 1000;

        console.log("it will create a new room : " + ids);

        var url = "/room?key=" + ids;
        console.log("redirect : " + url);
        res.redirect(url);
      } else {
        var roomNumber = req.query.key;

        // 클라이언트에 뷰 전달
        res.render("client.ejs", { room: roomNumber });
      }
    });
  }

  // 초기화 코드
  // socket.io 각 이벤트별 처리
  init() {
    // socket.io 설정
    this.io.on("connection", socket => {
      console.log("User Connected : ", socket.id);

      // room 번호를 사용해 접속 요청
      socket.on("request", room => {
        console.log("Request : " + room);

        var roomObject = this.io.sockets.adapter.rooms[room];
        var numClients = roomObject
          ? Object.keys(roomObject.sockets).length
          : 0;

        console.log("Room: " + room + ", Clients: " + numClients);

        if (numClients === 0) {
          // 방이 없으면 참여
          socket.join(room);
          socket.emit("response", 0);
        } else if (numClients === 1) {
          // 이미 방이 존재하고, 방안에 1명이 있으면 해당 사람에게 새 유저가 참여한다는 메시지 보냄
          this.io.sockets.in(room).emit("join", room);
          socket.join(room);
          socket.emit("response", 1);
        } else {
          // 방이 가득참
          socket.emit("response", 2);
        }
      });

      // 시그널링을 위한 메시지 처리
      socket.on("message", data => {
        console.log(data);

        // 상대방에게 message 전달
        socket.broadcast.to(data.room).emit("message", data.msg);
      });

      socket.on("disconnect", () => {
        socket.leaveAll();
        console.log("User has disconnected : ", socket.id);
      });
    });

    this.http.listen(8080, () => {
      console.log("Express server has started on port 8080");
    });
  }
};
