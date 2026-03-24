using RequestManager.Api.Models;
using System.ComponentModel.DataAnnotations;

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
    RequestStatus Status,
    DateTime Deadline);

public record RequestStatusChangeDto(
    RequestStatus NewStatus,
    string? Comment);

public record RequestQueryDto(
    RequestStatus? Status,
    RequestPriority? Priority,
    DateTime? DeadlineFrom,
    DateTime? DeadlineTo,
    string? CreatedByUserId,
    [StringLength(100, ErrorMessage = "Title search must be <= 100 characters.")]
    [RegularExpression(@"^[a-zA-Z0-9\s\-_]*$", ErrorMessage = "Title search allows letters, numbers, spaces, dash and underscore only.")]
    string? TitleSearch,
    int Page = 1,
    int PageSize = 10);

public record RequestListItemDto(
    Guid Id,
    string Title,
    string Description,
    RequestPriority Priority,
    RequestStatus Status,
    DateTime Deadline,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string CreatedByUserId,
    string? CreatedByUserEmail);

public record RequestUserLookupDto(string Id, string Email);

public record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalCount);
