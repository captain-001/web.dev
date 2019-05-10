// module
var express = require("express");
var app = express();
var path = require("path");
var ejs = require("ejs");
var AppServer = require("./server/server.js");

// 위치 및 ejs 설정
app.set("views", path.join(__dirname, "client"));
app.set("view engine", "ejs");
app.engine("html", ejs.renderFile);
app.use("/client", express.static(path.join(__dirname, "client")));
app.use("/res", express.static(path.join(__dirname, "res")));

// 서버 시작
var appServer = new AppServer(app);
appServer.init();
appServer.routing();
