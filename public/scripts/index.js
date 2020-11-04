const socket = io.connect("localhost:3333")
const { RTCPeerConnection, RTCSessionDescription } = window

let getCalled = false;
let isAlreadyCalling = false

const peerConnection = new RTCPeerConnection()

socket.on("update-user-list", ({ users }) => {
  console.log("Update user list")
  console.log(users)
  updateUserList(users);
});

socket.on("remove-user", ({ socketId }) => {
  const elToRemove = document.getElementById(socketId);

  if (elToRemove) {
    elToRemove.remove();
  }
});

socket.on("call-made", async data => {
  if (getCalled) {
    console.log('im getting called')
    const confirmed = window.confirm(
      `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
    );

    if (!confirmed) {
      socket.emit('reject-call', {
        from: data.socket
      })

      return
    }
  }
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  )

  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer))

  socket.emit("make-answer", {
    answer,
    to: data.socket
  })
  getCalled = true
})

socket.on("answer-made", async data => {
  console.log("Answer made!")
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );

  if (!isAlreadyCalling) {
    callUser(data.socket);
    isAlreadyCalling = true;
  }
});

socket.on("call-rejected", data => {
  alert(`User: "Socket: ${data.socket}" rejected your call.`);
  unselectUsersFromList();
});

peerConnection.ontrack = function ({ streams: [stream] }) {
  const remoteVideo = document.getElementById("remote-video");
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(
  stream => {
    const localVideo = document.getElementById("local-video")
    if (localVideo) {
      localVideo.srcObject = stream
    }

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
  }).catch(
    (error) => {
      console.log("deu ruim")
      console.warn(error.message)
    }
  )

function updateUserList(socketIds) {
  const activeUserContainer = document.getElementById("active-user-container");

  socketIds.forEach(socketId => {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser) {
      const userContainerEl = createUserItemContainer(socketId);
      activeUserContainer.appendChild(userContainerEl);
    }
  });
}

function createUserItemContainer(socketId) {
  const userContainerEl = document.createElement("div");

  const usernameEl = document.createElement("p");

  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", socketId);
  usernameEl.setAttribute("class", "username");
  usernameEl.innerHTML = `Socket: ${socketId}`;

  userContainerEl.appendChild(usernameEl);

  userContainerEl.addEventListener("click", () => {
    unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    const talkingWithInfo = document.getElementById("talking-with-info");
    talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
    callUser(socketId);
  });
  return userContainerEl;
}

async function callUser(socketId) {
  const offer = await peerConnection.createOffer()

  await peerConnection.setLocalDescription(new RTCSessionDescription(offer))

  socket.emit("call-user", {
    offer,
    to: socketId
  })
}

function unselectUsersFromList() {
  const alreadySelectedUser = document.querySelectorAll(
    ".active-user.active-user--selected"
  );

  alreadySelectedUser.forEach(el => {
    el.setAttribute("class", "active-user");
  });
}
