using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestManager.Api.Data;
using RequestManager.Api.Dtos;
using RequestManager.Api.Models;
using RequestManager.Api.Services;

namespace RequestManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RequestsController(AppDbContext db, IRequestTransitionPolicy transitionPolicy) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<RequestListItemDto>>> GetAll([FromQuery] RequestQueryDto query)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isManager = User.IsInRole(Roles.Manager);

        var requests = db.Requests.AsQueryable();

        if (!isManager)
        {
            requests = requests.Where(x => x.CreatedByUserId == userId);
        }
        else if (!string.IsNullOrWhiteSpace(query.CreatedByUserId))
        {
            requests = requests.Where(x => x.CreatedByUserId == query.CreatedByUserId);
        }

        var deadlineFrom = NormalizeToUtc(query.DeadlineFrom);
        var deadlineTo = NormalizeToUtc(query.DeadlineTo);

        if (query.Status.HasValue)
            requests = requests.Where(x => x.Status == query.Status.Value);
        if (query.Priority.HasValue)
            requests = requests.Where(x => x.Priority == query.Priority.Value);
        if (deadlineFrom.HasValue)
            requests = requests.Where(x => x.Deadline >= deadlineFrom.Value);
        if (deadlineTo.HasValue)
            requests = requests.Where(x => x.Deadline <= deadlineTo.Value);
        if (!string.IsNullOrWhiteSpace(query.TitleSearch))
            requests = requests.Where(x => EF.Functions.ILike(x.Title, $"%{query.TitleSearch.Trim()}%"));

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var totalCount = await requests.CountAsync();
        var items = await requests
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new RequestListItemDto(
                x.Id,
                x.Title,
                x.Description,
                x.Priority,
                x.Status,
                x.Deadline,
                x.CreatedAt,
                x.UpdatedAt,
                x.CreatedByUserId,
                x.CreatedByUser != null ? x.CreatedByUser.Email : null))
            .ToListAsync();

        return Ok(new PagedResult<RequestListItemDto>(items, page, pageSize, totalCount));
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<RequestUserLookupDto>>> GetUsers()
    {
        if (!User.IsInRole(Roles.Manager)) return Forbid();

        var managerRoleId = await db.Roles
            .Where(x => x.Name == Roles.Manager)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();

        var users = await db.Users
            .Where(u => string.IsNullOrWhiteSpace(managerRoleId)
                || !db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == managerRoleId))
            .OrderBy(x => x.Email)
            .Select(x => new RequestUserLookupDto(x.Id, x.Email ?? x.UserName ?? x.Id))
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RequestItem>> GetById(Guid id)
    {
        var request = await db.Requests
            .Include(x => x.StatusHistory)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (request is null) return NotFound();
        if (!CanAccessRequest(request)) return Forbid();

        return Ok(request);
    }

    [HttpPost]
    public async Task<ActionResult<RequestItem>> Create(RequestCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isManager = User.IsInRole(Roles.Manager);
        var initialStatus = isManager ? dto.Status : RequestStatus.Draft;

        var request = new RequestItem
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Deadline = NormalizeToUtc(dto.Deadline),
            Status = initialStatus,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Requests.Add(request);
        db.RequestStatusHistory.Add(new RequestStatusHistory
        {
            RequestId = request.Id,
            OldStatus = initialStatus,
            NewStatus = initialStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = userId,
            Comment = "Request created."
        });

        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<RequestItem>> Update(Guid id, RequestUpdateDto dto)
    {
        var request = await db.Requests.FirstOrDefaultAsync(x => x.Id == id);
        if (request is null) return NotFound();
        if (!CanAccessRequest(request)) return Forbid();
        if (request.Status == RequestStatus.Overdue)
            return BadRequest("Overdue requests cannot be edited.");

        var oldStatus = request.Status;
        var normalizedDeadline = NormalizeToUtc(dto.Deadline);
        var targetStatus = dto.Status;

        var isManager = User.IsInRole(Roles.Manager);
        if (!isManager && dto.Status != oldStatus)
        {
            return Forbid();
        }
        if (targetStatus == RequestStatus.Overdue)
        {
            return BadRequest("Overdue status is system-managed.");
        }
        if (targetStatus != oldStatus
            && !transitionPolicy.CanTransition(oldStatus, targetStatus, isManager))
        {
            return BadRequest($"Transition from {oldStatus} to {targetStatus} is not allowed.");
        }

        request.Title = dto.Title;
        request.Description = dto.Description;
        request.Priority = dto.Priority;
        request.Status = targetStatus;
        request.Deadline = normalizedDeadline;
        request.UpdatedAt = DateTime.UtcNow;

        if (targetStatus != oldStatus)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            db.RequestStatusHistory.Add(new RequestStatusHistory
            {
                RequestId = request.Id,
                OldStatus = oldStatus,
                NewStatus = targetStatus,
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = userId,
                Comment = "Status changed via request edit."
            });
        }

        await db.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPost("{id:guid}/status")]
    public async Task<ActionResult> ChangeStatus(Guid id, RequestStatusChangeDto dto)
    {
        var request = await db.Requests.FirstOrDefaultAsync(x => x.Id == id);
        if (request is null) return NotFound();
        if (!CanAccessRequest(request)) return Forbid();
        if (!User.IsInRole(Roles.Manager)) return Forbid();
        if (request.Status == RequestStatus.Overdue)
            return BadRequest("Overdue requests cannot be edited.");
        if (dto.NewStatus == RequestStatus.Overdue)
        {
            return BadRequest("Overdue status is system-managed.");
        }

        var isManager = User.IsInRole(Roles.Manager);
        if (!transitionPolicy.CanTransition(request.Status, dto.NewStatus, isManager))
        {
            return BadRequest($"Transition from {request.Status} to {dto.NewStatus} is not allowed.");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var oldStatus = request.Status;
        request.Status = dto.NewStatus;
        request.UpdatedAt = DateTime.UtcNow;

        db.RequestStatusHistory.Add(new RequestStatusHistory
        {
            RequestId = request.Id,
            OldStatus = oldStatus,
            NewStatus = dto.NewStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = userId,
            Comment = dto.Comment
        });

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/history")]
    public async Task<ActionResult<IEnumerable<RequestStatusHistory>>> GetHistory(Guid id)
    {
        var request = await db.Requests.FirstOrDefaultAsync(x => x.Id == id);
        if (request is null) return NotFound();
        if (!CanAccessRequest(request)) return Forbid();

        var history = await db.RequestStatusHistory
            .Where(x => x.RequestId == id)
            .OrderByDescending(x => x.ChangedAt)
            .ToListAsync();

        return Ok(history);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var request = await db.Requests.FirstOrDefaultAsync(x => x.Id == id);
        if (request is null) return NotFound();
        if (!User.IsInRole(Roles.Manager)) return Forbid();

        var history = db.RequestStatusHistory.Where(x => x.RequestId == id);
        db.RequestStatusHistory.RemoveRange(history);
        db.Requests.Remove(request);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private bool CanAccessRequest(RequestItem request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return User.IsInRole(Roles.Manager) || request.CreatedByUserId == userId;
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private static DateTime? NormalizeToUtc(DateTime? value)
    {
        if (!value.HasValue) return null;
        return NormalizeToUtc(value.Value);
    }
}
