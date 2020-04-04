namespace CameraStream.Models
{
    using System.Collections.Generic;
    public class User
    {
        public string Username { get; set; }
        public string ConnectionId { get; set; }
        public bool InCall { get; set; }
    }
}
