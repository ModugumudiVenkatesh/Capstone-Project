using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProfileBookAPI.Data;
using ProfileBookAPI.Hubs;
using ProfileBookAPI.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using ProfileBookAPI.DTOs;

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
                    m.MessageContent,
                    m.TimeStamp,
                    Sender = m.SenderId,
                    Receiver = m.ReceiverId
                })
                .ToList();

            return Ok(messages);
        }

        [HttpPost]
        public IActionResult SendMessage([FromBody] SendMessageDto dto)
        {
            var senderId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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

            return Ok(new
            {
                message.Id,
                message.MessageContent,
                Sender = message.SenderId,
                Receiver = message.ReceiverId,
                message.TimeStamp
            });
        }
    }
}