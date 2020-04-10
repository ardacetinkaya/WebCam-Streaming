'use strict';

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

var hubUrl = document.location.origin + '/cnnctn';
var hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, signalR.HttpTransportType.WebSockets)
    .configureLogging(signalR.LogLevel.None)
    .build();

var peerConnection;
var configuration = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };
var users = [];
var user = null;
var caller = null;

$(document).ready(function () {
    hubConnection.start().then(() => {
        user = generateId();
        userJoin(user);
        console.info(`Connected as ${user}`);

    }).catch(err => console.error(err));

    hubConnection.on('updateOnlineUsers', (userList) => {
        console.info('Check online users...' + JSON.stringify(userList));
        users = userList;

        $('#usersdata li.user').remove();

        $.each(userList, function (index) {
            var userIcon = '', status = '';
            if (userList[index].username === $("#lblUser").text()) {

            } else {
                var onlineUsers = '';
                onlineUsers += '<li class="list-group-item user" data-cid=' + userList[index].connectionId + ' data-username=' + userList[index].username + '>';
                onlineUsers += '<div class="d-lg-flex flex-row">';
                onlineUsers += '<div class="m-1 d-lg-flex justify-content-center align-items-center"><small>' + userList[index].username + '</small></div>';

                if (userList[index].username !== user) {
                    onlineUsers += '<div class="d-flex flex-row justify-content-center align-items-center">';
                    onlineUsers += '<div class="m-1 d-lg-flex justify-content-center align-items-center"><span data-callstatus=' + userList[index].inCall + '>' + ((userList[index].inCall == true) ? '<small>(In call)</small>' : '<small>(Idle)</small>') + '</span></div>';
                    onlineUsers += '<div class="m-2"><button id="btnCallUser" type="button" class="btn btn-primary btn-sm" ' + ((userList[index].inCall == true) ? 'disabled' : '') + ' onclick="callUser(\'' + userList[index].connectionId + '\')">Call</button></div>';
                    onlineUsers += '<div class="m-2"><button id="btnEndCall" type="button" class="btn btn-primary btn-sm" ' + ((userList[index].inCall == true) ? '' : 'disabled') + 'onclick="endCall(\'' + userList[index].connectionId + '\')">End</button></div>';
                    onlineUsers += '</div>';
                }
                onlineUsers += '</div></li>';
                $('#usersdata').append(onlineUsers);
            }
        });

        const isCaller = users.length === 2;
        peerConnection = new RTCPeerConnection(configuration);
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                var targetUserConnectionId = users.filter(u => u.username != user);
                console.info(`Target user: ${targetUserConnectionId[0].username}`);
                hubConnection.invoke('sendData', JSON.stringify({ 'candidate': event.candidate }), targetUserConnectionId[0].connectionId).catch(err => console.error(err));
            }
        };
        if (isCaller) {
            console.info('Someone is also here...');
            peerConnection.onnegotiationneeded = () => {
                peerConnection.createOffer()
                    .then((description) => {
                        peerConnection.setLocalDescription(
                            description,
                            () => {
                                var targetUserConnectionId = users.filter(u => u.username != user);
                                hubConnection.invoke('sendData', JSON.stringify({ 'sdp': peerConnection.localDescription }), targetUserConnectionId[0].connectionId).catch(err => console.error(err));
                            },
                            (err) => console.info(err)
                        );
                    })
                    .catch(err => console.error(err));
            }
        }

        peerConnection.ontrack = event => {
            const stream = event.streams[0];
            if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== stream.id) {
                remoteVideo.srcObject = stream;
            }
        };

        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        }).then(stream => {
            // Display your local video in #localVideo element
            localVideo.srcObject = stream;
            // Add your stream to be sent to the conneting peer
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        }, (err) => console.error(err));
    });

    hubConnection.on('receiveData', (signalingUser, data) => {
        var message = JSON.parse(data);

        if (message.sdp) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {

                if (peerConnection.remoteDescription.type === 'offer') {
                    peerConnection.createAnswer()
                        .then((description) => {
                            peerConnection.setLocalDescription(
                                description,
                                () => {
                                    var targetUserConnectionId = users.filter(u => u.username != user);
                                    hubConnection.invoke('sendData', JSON.stringify({ 'sdp': peerConnection.localDescription }), targetUserConnectionId[0].connectionId)
                                        .catch(err => console.error(err));
                                },
                                (err) => console.error(err)
                            );
                        })
                        .catch(err => console.error(err));
                }
            }, (err) => console.error(err));
        } else if (message.candidate) {

            peerConnection.addIceCandidate(
                new RTCIceCandidate(message.candidate), () => { }, (err) => console.error(err)
            );
        }

    });

    hubConnection.on('incomingCall', (callingUser) => {
        console.info('Incoming call from: ' + JSON.stringify(callingUser));
        caller = callingUser;
        $('#callmodal').attr('data-callinguser', `${callingUser.username}`);
        $('#callmodal .modal-body').text(`${callingUser.username} is calling...`);
        $('#callmodal').modal('show');
    });
});

const acceptCall = () => {
    var callingUserName = $('#callmodal').attr('data-cid');
    hubConnection.invoke('AnswerCall', true, caller).catch(err => console.error(err));
    $('#callmodal').modal('hide');

};

const declineCall = () => {
    var callingUserName = $('#callmodal').attr('data-cid');
    hubConnection.invoke('AnswerCall', false, caller).catch(err => console.error(err));
    $('#callmodal').modal('hide');
};

const userJoin = (username) => {
    console.info('Joining...');
    hubConnection.invoke("Join", username).catch((err) => {
        console.error(err);
    });
};

const callUser = (connectionId) => {
    hubConnection.invoke('call', { "connectionId": connectionId });
};
const endCall = (connectionId) => {
    hubConnection.invoke('hangUp');
};
