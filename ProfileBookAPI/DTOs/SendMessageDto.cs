namespace ProfileBookAPI.DTOs
{
    public class SendMessageDto
{
    public int ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
}
}
