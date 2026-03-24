namespace RequestManager.Api.Models;

public enum RequestPriority
{
    Low,
    Medium,
    High
}

public enum RequestStatus
{
    Draft,
    Open,
    InProgress,
    Done,
    Overdue,
    Cancelled
}
