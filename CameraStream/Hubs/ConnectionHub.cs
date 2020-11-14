namespace CameraStream.Hubs
{
    using CameraStream.Models;
    using Microsoft.AspNetCore.SignalR;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Channels;
    using System.Threading.Tasks;
    public class ConnectionHub : Hub<IConnectionHub>
    {
        private readonly List<User> _users;
        private readonly List<Connection> _connections;
        private readonly List<Call> _calls;

        public ConnectionHub(List<User> users, List<Connection> userCalls, List<Call> calls)
        {
            _users = users;
            _connections = userCalls;
            _calls = calls;
        }

        public async Task Join(string username)
        {
            _users.Add(new User
            {
                Username = username,
                ConnectionId = Context.ConnectionId
            });

            await UpdateOnlineUsers();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await HangUp();

            _users.RemoveAll(u => u.ConnectionId == Context.ConnectionId);

            await UpdateOnlineUsers();

            await base.OnDisconnectedAsync(exception);
        }

        public async Task Call(User targetConnectionId)
        {
            var callingUser = _users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
            var targetUser = _users.SingleOrDefault(u => u.ConnectionId == targetConnectionId.ConnectionId);

            if (targetUser == null)
            {
                await Clients.Caller.CallDeclined(targetConnectionId, "The user you called has left.");
                return;
            }

            // Check connection
            if (GetConnection(targetUser.ConnectionId) != null)
            {
                await Clients.Caller.CallDeclined(targetConnectionId, string.Format("{0} is already in a call.", targetUser.Username));
                return;
            }

            await Clients.Client(targetConnectionId.ConnectionId).IncomingCall(callingUser);

            _calls.Add(new Call
            {
                From = callingUser,
                To = targetUser,
                CallStartTime = DateTime.Now
            });
        }

        public async Task AnswerCall(bool acceptCall, User targetConnectionId)
        {
            var callingUser = _users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
            var targetUser = _users.SingleOrDefault(u => u.ConnectionId == targetConnectionId.ConnectionId);


            if (callingUser == null)
            {
                return;
            }

            if (targetUser == null)
            {
                await Clients.Caller.CallEnded(targetConnectionId, "The user has left.");
                return;
            }

            if (!acceptCall)
            {
                await Clients.Client(targetConnectionId.ConnectionId).CallDeclined(callingUser, $"{callingUser.Username} did not accept your call.");
                return;
            }

            var callCount = _calls.RemoveAll(c => c.To.ConnectionId == callingUser.ConnectionId && c.From.ConnectionId == targetUser.ConnectionId);
            if (callCount < 1)
            {
                await Clients.Caller.CallEnded(targetConnectionId, $"{targetUser.Username} has already end the call.");
                return;
            }

            // Check if user is in another call
            if (GetConnection(targetUser.ConnectionId) != null)
            {
                await Clients.Caller.CallDeclined(targetConnectionId, $"{targetUser.Username} is in another call.");
                return;
            }

            // Remove all the other offers for the call initiator, in case they have multiple calls out
            _calls.RemoveAll(c => c.From.ConnectionId == targetUser.ConnectionId);

            _connections.Add(new Connection
            {
                Users = new List<User> { callingUser, targetUser }
            });

            await Clients.Client(targetConnectionId.ConnectionId).CallAccepted(callingUser);

            await UpdateOnlineUsers();
        }

        public async Task HangUp()
        {
            var callingUser = _users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);

            if (callingUser == null)
            {
                return;
            }

            var currentCall = GetConnection(callingUser.ConnectionId);

            // Send a hang up message to each user in the call, if there is one
            if (currentCall != null)
            {
                foreach (var user in currentCall.Users.Where(u => u.ConnectionId != callingUser.ConnectionId))
                {
                    await Clients.Client(user.ConnectionId).CallEnded(callingUser, $"{callingUser.Username} has hung up.");
                }

                currentCall.Users.RemoveAll(u => u.ConnectionId == callingUser.ConnectionId);
                if (currentCall.Users.Count < 2)
                {
                    _connections.Remove(currentCall);
                }
            }

            _calls.RemoveAll(c => c.From.ConnectionId == callingUser.ConnectionId);

            await UpdateOnlineUsers();
        }

        public async Task SendData(string data, string targetConnectionId)
        {
            var callingUser = _users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);
            var targetUser = _users.SingleOrDefault(u => u.ConnectionId == targetConnectionId);

            if (callingUser == null || targetUser == null)
            {
                return;
            }


            //Check the connection 
            var userCall = GetConnection(callingUser.ConnectionId);
            if (userCall != null && userCall.Users.Exists(u => u.ConnectionId == targetUser.ConnectionId))
            {
                await Clients.Client(targetConnectionId).ReceiveData(callingUser, data);
            }
        }

        public async Task UploadStream(ChannelReader<string> stream, string targetConnectionId)
        {
            var callingUser = _users.SingleOrDefault(u => u.ConnectionId == Context.ConnectionId);

            while (await stream.WaitToReadAsync())
            {
                while (stream.TryRead(out var item))
                {
                    if (!string.IsNullOrEmpty(item))
                    {
                        var dataStream = item.Split('|');
                        if (!string.IsNullOrEmpty(dataStream[0]))
                        {
                            var connectionId = dataStream[0].Trim().TrimStart('\b');
                            var targetUser = _users.SingleOrDefault(u => u.ConnectionId == connectionId);
                            if (targetUser != null)
                            {
                                await Clients.Client(targetUser.ConnectionId).ReceiveData(callingUser, dataStream[1]);
                            }
                        }

                    }


                }
            }
        }

        public ChannelReader<string> DownloadStream(int delay, CancellationToken cancellationToken)
        {
            var channel = Channel.CreateUnbounded<string>();
            _ = WriteItemsAsync(channel.Writer, DateTime.Now.Millisecond.ToString(), delay, cancellationToken);

            return channel.Reader;
        }

        private static async Task WriteItemsAsync(ChannelWriter<string> writer, string data, int delay, CancellationToken cancellationToken)
        {
            Exception localException = null;
            try
            {
                await writer.WriteAsync(data, cancellationToken);
                await Task.Delay(delay, cancellationToken);

            }
            catch (Exception ex)
            {
                localException = ex;
            }

            writer.Complete(localException);
        }

        private async Task UpdateOnlineUsers()
        {
            _users.ForEach(u => u.InCall = (GetConnection(u.ConnectionId) != null));
            await Clients.All.UpdateOnlineUsers(_users);
        }

        private Connection GetConnection(string connectionId)
        {
            var matchingCall = _connections.FirstOrDefault(uc => uc.Users.FirstOrDefault(u => u.ConnectionId == connectionId) != null);
            return matchingCall;
        }
    }
}
