using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProfileBookAPI.Data;
using ProfileBookAPI.Hubs;
using ProfileBookAPI.Models;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProfileBookAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public MessagesController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet("with/{receiverId}")]
        public IActionResult GetMessagesWith(int receiverId)
        {
            var senderId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var messages = _context.Messages
                .Where(m => (m.SenderId == senderId && m.ReceiverId == receiverId) ||
                            (m.SenderId == receiverId && m.ReceiverId == senderId))
                .OrderBy(m => m.TimeStamp)
                .Select(m => new
                {
                    m.Id,
                    content = m.MessageContent,
                    timestamp = m.TimeStamp,
                    senderId = m.SenderId,
                    receiverId = m.ReceiverId,
                    sender = m.Sender.Username,
                    isSent = m.SenderId == senderId
                })
                .ToList();

            return Ok(messages);
        }

        // CHANGE THIS: Use [HttpPost] without route or use [HttpPost("send")] but be consistent
        [HttpPost] // This handles POST /api/messages
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            var senderId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var senderUsername = User.FindFirstValue(ClaimTypes.Name);

            var receiver = _context.Users.FirstOrDefault(u => u.Id == dto.ReceiverId);
            if (receiver == null) return NotFound("Receiver not found.");

            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = dto.ReceiverId,
                MessageContent = dto.Content,
                TimeStamp = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            _context.SaveChanges();

            // Send via SignalR
            await _hubContext.Clients.User(receiver.Id.ToString())
                .SendAsync("ReceiveMessage", senderUsername, dto.Content, senderId, DateTime.UtcNow);

            return Ok(new
            {
                id = message.Id,
                content = message.MessageContent,
                senderId = message.SenderId,
                receiverId = message.ReceiverId,
                timestamp = message.TimeStamp,
                sender = senderUsername
            });
        }
    }

    public class SendMessageDto
    {
        public int ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}