namespace RequestManager.Api.Models;

public class RequestItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RequestPriority Priority { get; set; } = RequestPriority.Medium;
    public RequestStatus Status { get; set; } = RequestStatus.Draft;
    public DateTime Deadline { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedByUserId { get; set; } = string.Empty;
    public AppUser? CreatedByUser { get; set; }
    public List<RequestStatusHistory> StatusHistory { get; set; } = [];
}
