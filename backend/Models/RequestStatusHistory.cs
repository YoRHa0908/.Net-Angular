namespace RequestManager.Api.Models;

public class RequestStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequestId { get; set; }
    public RequestItem? Request { get; set; }
    public RequestStatus OldStatus { get; set; }
    public RequestStatus NewStatus { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string ChangedByUserId { get; set; } = string.Empty;
    public string? Comment { get; set; }
}
