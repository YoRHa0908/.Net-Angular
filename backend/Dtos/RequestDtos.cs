using RequestManager.Api.Models;

namespace RequestManager.Api.Dtos;

public record RequestCreateDto(
    string Title,
    string Description,
    RequestPriority Priority,
    DateTime Deadline,
    RequestStatus Status);

public record RequestUpdateDto(
    string Title,
    string Description,
    RequestPriority Priority,
    DateTime Deadline);

public record RequestStatusChangeDto(
    RequestStatus NewStatus,
    string? Comment);

public record RequestQueryDto(
    RequestStatus? Status,
    RequestPriority? Priority,
    DateTime? DeadlineFrom,
    DateTime? DeadlineTo,
    string? TitleSearch,
    int Page = 1,
    int PageSize = 10);

public record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalCount);
