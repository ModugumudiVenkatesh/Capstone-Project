using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace ProfileBookAPI.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string receiverUsername, string message, string senderUsername)
        {
            await Clients.User(receiverUsername).SendAsync("ReceiveMessage", senderUsername, message);
        }
    }
}
