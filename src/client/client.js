/*
  RTCPeerConnection 클래스

*/

class PeerClient {
  constructor() {
    this.peerConnection = null;
    this.dataChannel = null;
  }

  //
  // RTCPeerConnection 객체 생성
  createConnection() {
    var servers = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302"
        },
        {
          urls: "turn:numb.viagehie.ca",
          credential: "muazkh",
          username: "webrtc@live.com"
        }
      ]
    };
    // 로컬 RTCPeer 연결 생성
    this.peerConnection = new RTCPeerConnection(servers);
  }

  //
  // 이벤트 콜백 설정
  // 로컬과 원격 커넥션에 필요한 이벤트가 다르므로 별도로 구성
  initLocalConnection(sdpCallback, iceCallback, channelCallback) {
    console.log("initLocalConnection() - " + this.peerConnection);
    // 주요 이벤트에 대한 콜백을 정의한다.
    // onicecandidate
    // onnegotiationneeded
    // ondatachannel

    // 로컬 ice cadidate 이벤트 처리 정의
    // candidate는 시그널링 서버를 통해 전달
    this.peerConnection.onicecandidate = event => {
      console.log("onIceCandidate");
      if (event.candidate) {
        iceCallback(event.candidate);
      }
    };

    // 세션 협상 이벤트 처리 정의
    this.peerConnection.onnegotiationneeded = event => {
      console.log("onNegotiationNeeded");
      // offer
      this.peerConnection
        .createOffer()
        .then(desc => {
          console.log("createOffer");
          return this.peerConnection.setLocalDescription(desc);
        })
        .then(() => {
          console.log("setLocalDescription");
          sdpCallback(this.peerConnection.localDescription);
        })
        .catch(error => {});
    };

    // 로컬측 채널 생성
    console.log("createDataChannel");
    this.dataChannel = this.peerConnection.createDataChannel("sendDataChannel");
    this.dataChannel.onmessage = channelCallback;
    this.dataChannel.onopen = () => {
      console.log("DataChannel has opened");
      this.sendData(999);
    };
    this.dataChannel.onclose = () => {};
  }

  //
  // 원격 커넥션 이벤트 설정
  initRemoteConnection(iceCallback, channelCallback) {
    console.log("initRemoteConnection() - " + this.peerConnection);
    // 로컬 ice cadidate 이벤트 처리 정의
    this.peerConnection.onicecandidate = event => {
      console.log("onIceCandidate");
      if (event.candidate) {
        iceCallback(event.candidate);
      }
    };

    // 원격측 채널 설정
    this.peerConnection.ondatachannel = event => {
      console.log("onDataChannel");

      this.dataChannel = event.channel;
      this.dataChannel.onmessage = channelCallback;
      this.dataChannel.onopen = () => {
        console.log("DataChannel has opened");
        this.sendData(999);
      };
      this.dataChannel.onclose = () => {};
    };
  }

  //
  // 시그널링 서버에서 전달된 SDP 설정
  setRemoteDescription(sdp, callback) {
    console.log("setRemoteDescription");

    var desc = new RTCSessionDescription(sdp);
    this.peerConnection
      .setRemoteDescription(desc)
      .then(() => {
        if (this.peerConnection.remoteDescription.type === "offer") {
          this.peerConnection
            .createAnswer()
            .then(answer => {
              console.log("createAnswer");
              return this.peerConnection.setLocalDescription(answer);
            })
            .then(() => {
              console.log("setLocalDescription : Answer");
              callback(this.peerConnection.localDescription);
            })
            .catch(error => {});
        }
      })
      .catch(error => {});
  }

  //
  // 시그널링 서버에서 전달된 Candidate 설정
  setIceCandidate(msg) {
    var candidate = new RTCIceCandidate(msg.candidate);
    this.peerConnection.addIceCandidate(candidate);
  }

  //
  // 데이터 채널로 데이터 전송
  sendData(data) {
    this.dataChannel.send(data);
  }

  //
  //
  closeConnection() {
    this.dataChannel.close();
    this.peerConnection.close();
    this.dataChannel = null;
    this.peerConnection = null;
  }

  isAvailableConnection() {
    if (this.peerConnection) {
      return true;
    }
    return false;
  }
}
