using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfileBookAPI.Data;
using ProfileBookAPI.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;


namespace ProfileBookAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public PostsController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost]
        public IActionResult CreatePost([FromForm] PostCreateDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            string? filePath = null;
            if (dto.Image != null)
            {
                string uploads = Path.Combine(_env.WebRootPath, "uploads");
                if (!Directory.Exists(uploads))
                    Directory.CreateDirectory(uploads);

                string fileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.Image.FileName);
                filePath = Path.Combine("uploads", fileName);
                using (var stream = new FileStream(Path.Combine(_env.WebRootPath, filePath), FileMode.Create))
                {
                    dto.Image.CopyTo(stream);
                }
            }

            var post = new Post
            {
                Content = dto.Content,
                PostImage = filePath,
                UserId = userId,
                Status = "Pending"
            };

            _context.Posts.Add(post);
            _context.SaveChanges();
            return Ok(post);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetAllPosts()
        {
            return Ok(_context.Posts.ToList());
        }

        // get approved
        [HttpGet("approved")]
        [AllowAnonymous]
        public IActionResult GetApprovedPosts()
        {
            var posts = _context.Posts
                .Where(p => p.Status == "Approved")
                .ToList();
            return Ok(posts);
        }

        //approve
        [HttpPut("approve/{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult ApprovePost(int id)
        {
            var post = _context.Posts.FirstOrDefault(p => p.Id == id);
            if (post == null) return NotFound();

            post.Status = "Approved";
            _context.SaveChanges();
            return Ok(new { message = "Post approved." });
        }

        //reject
        [HttpPut("reject/{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult RejectPost(int id)
        {
            var post = _context.Posts.FirstOrDefault(p => p.Id == id);
            if (post == null) return NotFound();

            post.Status = "Rejected";
            _context.SaveChanges();
            return Ok(new { message = "Post rejected." });
        }

        //like post
        [HttpPost("{id}/like")]
        public IActionResult LikePost(int id)
        {
            var post = _context.Posts.FirstOrDefault(p => p.Id == id && p.Status == "Approved");
            if (post == null) return NotFound("Post not found or not approved yet.");

            post.Likes++;
            _context.SaveChanges();
            return Ok(new { message = "Post liked successfully", likes = post.Likes });
        }

        //unlike post
        [HttpPost("{id}/unlike")]
        public IActionResult UnlikePost(int id)
        {
            var post = _context.Posts.FirstOrDefault(p => p.Id == id && p.Status == "Approved");
            if (post == null) return NotFound("Post not found or not approved yet.");

            if (post.Likes > 0)
            {
                post.Likes--;
                _context.SaveChanges();
            }

            return Ok(new { message = "Post unliked successfully", likes = post.Likes });
        }



        // comment
        [HttpPost("{id}/comment")]
        public IActionResult CommentOnPost(int id, [FromBody] CommentDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = _context.Users.Find(userId);

            var comment = new Comment
            {
                PostId = id,
                UserId = userId,
                Text = dto.Text
                // CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            _context.SaveChanges();

            return Ok(new
            {
                comment.Id,
                comment.Text,
                // comment.CreatedAt,
                UserName = user.Username,
                // UserFullName = user.FullName 
            });
        }


        // get comment
        [HttpGet("{id}/comments")]
        public IActionResult GetComments(int id)
        {
            var comments = _context.Comments
                .Where(c => c.PostId == id)
                // .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Text,
                    //   c.CreatedAt,
                    UserName = c.User.Username, // Get actual username
                    // UserFullName = c.User.FullName // Or whatever field has the name
                })
                .ToList();
            return Ok(comments);
        }

        // search
        [HttpGet("search")]
        [AllowAnonymous]
        public IActionResult SearchPosts([FromQuery] string query)
        {
            var results = _context.Posts
                .Where(p => p.Status == "Approved" &&
                           (p.Content.Contains(query) || p.User.Username.Contains(query)))
                .Select(p => new
                {
                    p.Id,
                    p.Content,
                    p.PostImage,
                    p.Status,
                    Author = p.User!.Username,
                    p.Likes
                })
                .ToList();

            return Ok(results);
        }



    }
}
