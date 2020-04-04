var video = document.getElementById('video');
var server = document.getElementById("server");
var btnConnect = document.getElementById("btnConnect");
var btnOpenCamera = document.getElementById("btnOpenCamera");
var btnClose = document.getElementById("btnClose");
var lblState = document.getElementById("lblState");
var img = document.getElementById('img');

var socket;
var scheme = document.location.protocol === "https:" ? "wss" : "ws";
var port = document.location.port ? (":" + document.location.port) : "";

var hubUrl = document.location.pathname + 'cnnctn';
var hubconnection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, signalR.HttpTransportType.WebSockets)
    .configureLogging(signalR.LogLevel.None).build();
var subject = new signalR.Subject();
var callinguser = null;
var acceptinguser = "";
$(document).ready(function () {
    server.value = scheme + "://" + document.location.hostname + port + "/ws";

    hubconnection.start().then(() => {
        console.log("Connected...");
        userJoin(generateId());
    }).catch(err => console.log(err));
});

hubconnection.on('updateOnlineUsers', (userList) => {
    console.log('Check online users...' + JSON.stringify(userList));
    $('#usersdata li.user').remove();

    $.each(userList, function (index) {
        var userIcon = '', status = '';
        if (userList[index].username === $("#lblUser").text()) {
            myConnectionId = userList[index].connectionId;

        } else {
            var onlineUsers = '<li class="list-group-item user" data-cid=' + userList[index].connectionId + ' data-username=' + userList[index].username + '>';
            onlineUsers += '<div class="d-lg-flex flex-row">';
            onlineUsers += '<div class="m-1 d-lg-flex justify-content-center align-items-center"><small>' + userList[index].username + '</small></div>';
            onlineUsers += '<div class="d-flex flex-row justify-content-center align-items-center">';
            onlineUsers += '<div class="m-1 d-lg-flex justify-content-center align-items-center"><span data-callstatus=' + userList[index].inCall + '>' + ((userList[index].inCall == true) ? '<small>(In call)</small>' : '<small>(Idle)</small>') + '</span></div>';
            onlineUsers += '<div class="m-2"><button id="btnCallUser" type="button" class="btn btn-primary btn-sm" ' + ((userList[index].inCall == true) ? 'disabled' : '') + ' onclick="callUser(\'' + userList[index].connectionId + '\')">Call</button></div>';
            onlineUsers += '<div class="m-2"><button id="btnEndCall" type="button" class="btn btn-primary btn-sm" ' + ((userList[index].inCall == true) ? '' : 'disabled') + 'onclick="endCall(\'' + userList[index].connectionId + '\')">End</button></div>';
            onlineUsers += '</div>';
            onlineUsers += '</div></li>';
            $('#usersdata').append(onlineUsers);
        }
    });
});

hubconnection.on('callAccepted', (acceptingUser) => {
    console.log('Call accepted by ' + JSON.stringify(acceptingUser) + '.');
    acceptinguser = acceptingUser;
});

hubconnection.on('callDeclined', (decliningUser, reason) => {
    console.log('Call declined by ' + decliningUser.connectionId);
});

hubconnection.on('incomingCall', (callingUser) => {
    console.log('Incoming call from: ' + JSON.stringify(callingUser));
    callinguser = callingUser;
    $('#callmodal').attr('data-callinguser', `${callingUser.username}`);
    $('#callmodal .modal-body').text(`${callingUser.username} is calling...`);
    $('#callmodal').modal('show');
});

hubconnection.on('receiveData', (signalingUser, data) => {
    document.getElementById('imgHub').src = '';
    if (data.toString().startsWith('data:,') == false) {
        var image = new Image();
        image.src = `${data}`;
        document.getElementById('imgHub').src = image.src;
    }
});

hubconnection.on('callEnded', (signalingUser, signal) => {
    console.log('Call with ' + signalingUser.connectionId + ' has ended: ' + signal);
    document.getElementById('imgHub').src = '';
});


const sendSignal = (candidate, partnerClientId) => {
    hubconnection.invoke('sendData', candidate, partnerClientId).catch(err => console.log(err));
};

const callUser = (connectionId) => {
    hubconnection.invoke('call', { "connectionId": connectionId });
};

const endCall = (connectionId) => {
    hubconnection.invoke('hangUp');
};

const acceptCall = () => {
    var callingUserName = $('#callmodal').attr('data-cid');
    hubconnection.invoke('AnswerCall', true, callinguser).catch(err => console.log(err));
    $('#callmodal').modal('hide');

};

const declineCall = () => {
    var callingUserName = $('#callmodal').attr('data-cid');
    hubconnection.invoke('AnswerCall', false, callinguser).catch(err => console.log(err));
    $('#callmodal').modal('hide');
};


const userJoin = (username) => {
    console.log('Joining...');
    hubconnection.invoke("Join", username).catch((err) => {
        console.log(err);
    });

    $("#lblUser").text(username);
    dataStream('');
};

dataStream = (acceptingUser) => {
    if (hubconnection.state === 'Connected')
        hubconnection.send("UploadStream", subject, `${(acceptingUser) ? acceptingUser.connectionId : ''}`);
}

const intervalHandle = setInterval(() => {
    var state = btnOpenCamera.getAttribute('data-state');
    if (state === 'opened') {
        subject.next(`${(acceptinguser) ? acceptinguser.connectionId : ''}|${getVideoFrame()}`);
        hubconnection.stream("DownloadStream", 500)
            .subscribe({
                next: (item) => {
                    console.log(item);
                },
                complete: () => {

                },
                error: (err) => {
                    console.error(err);
                },
            });
    } else {
        //subject.complete();
    }
}, 500);

const generateId = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
};

btnOpenCamera.onclick = function () {
    var state = btnOpenCamera.getAttribute('data-state')
    if (state === 'opened') {
        var stream = video.srcObject;
        var tracks = stream.getTracks();

        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            track.stop();
        }
        video.srcObject = null;
        btnOpenCamera.setAttribute('data-state', 'closed');
        document.getElementById('imgHub').src = '';
        btnOpenCamera.classList.add('btn-info');
        btnOpenCamera.classList.remove('btn-danger');
        btnOpenCamera.innerHTML = "Open Camera";
    } else {

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { width: 200, height: 200 }, frameRate: { ideal: 5, max: 10 }, audio: false }).then(function (stream) {
                video.srcObject = stream;
                video.play();
            });
        }
        btnOpenCamera.setAttribute('data-state', 'opened');
        btnOpenCamera.classList.add('btn-danger');
        btnOpenCamera.classList.remove('btn-info');
        btnOpenCamera.innerHTML = "Close Camera";
    }
};

btnClose.onclick = function () {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("WebSocket not connected.");
    }
    socket.close(1000, "Closing...");
};

btnConnect.onclick = function () {
    lblState.innerHTML = "Connecting...";
    socket = new WebSocket(server.value);
    socket.onopen = function (event) {
        updateState();
        lblState.innerHTML = `Connected to ${server.value}`;
        setInterval(() => {
            if (isOpen(socket)) {
                var data = getVideoFrame();
                socket.send(data);
            }
        }, 1000 / 6);
    };
    socket.onclose = function (event) {
        updateState();
    };
    socket.onerror = updateState;
    socket.onmessage = message => {
        document.getElementById('img').src = '';
        var image = new Image();
        image.src = `data:image/jpeg;base64,${message.data}`;
        document.getElementById('img').src = image.src;


    }
};

const updateState = () => {
    function disable() {
        btnClose.disabled = true;
    }
    function enable() {
        btnClose.disabled = false;
    }

    server.disabled = true;
    btnConnect.disabled = true;

    if (!socket) {
        disable();
    } else {
        switch (socket.readyState) {
            case WebSocket.CLOSED:
                lblState.innerHTML = "Closed";
                disable();
                server.disabled = false;
                btnConnect.disabled = false;
                img.src = '';
                break;
            case WebSocket.CLOSING:
                lblState.innerHTML = "Closing...";
                disable();
                break;
            case WebSocket.CONNECTING:
                lblState.innerHTML = "Connecting...";
                disable();
                break;
            case WebSocket.OPEN:
                lblState.innerHTML = "Open";
                enable();
                break;
            default:
                lblState.innerHTML = "Unknown state: " + htmlEscape(socket.readyState);
                disable();
                break;
        }
    }
}

const getVideoFrame = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 0.2);
    return data;
}

const isOpen = (ws) => {
    return ws.readyState === ws.OPEN;
}

const htmlEscape = (str) => {
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}