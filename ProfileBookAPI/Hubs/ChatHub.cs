using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace ProfileBookAPI.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(int receiverId, string message, int senderId, string senderUsername)
        {
            await Clients.User(receiverId.ToString()).SendAsync("ReceiveMessage", senderUsername, message, senderId, System.DateTime.UtcNow);
        }

        public override async Task OnConnectedAsync()
        {
            // You can add user to groups or perform other setup here
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Clean up when user disconnects
            await base.OnDisconnectedAsync(exception);
        }
    }
}