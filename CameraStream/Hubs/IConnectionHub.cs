
namespace CameraStream.Hubs
{
    using System.Collections.Generic;
    using System.Threading.Channels;
    using System.Threading.Tasks;
    using CameraStream.Models;

    public interface IConnectionHub
    {
        Task UpdateOnlineUsers(List<User> userList);
        Task CallAccepted(User acceptingUser);
        Task CallDeclined(User decliningUser, string reason);
        Task IncomingCall(User callingUser);
        Task ReceiveData(User signalingUser, string signal);
        Task UploadStream(ChannelReader<string> stream);
        Task CallEnded(User signalingUser, string signal);
    }
}