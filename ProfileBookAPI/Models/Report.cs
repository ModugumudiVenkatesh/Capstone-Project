using System.ComponentModel.DataAnnotations;

namespace ProfileBookAPI.Models
{
    public class Report
    {
        public int Id { get; set; }

        [Required]
        public string Reason { get; set; } = string.Empty;

        public DateTime TimeStamp { get; set; } = DateTime.UtcNow;

       
        public int ReportingUserId { get; set; }
        public User? ReportingUser { get; set; }

      
        public int ReportedUserId { get; set; }
        public User? ReportedUser { get; set; }
    }
}
