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
    public async Task<ActionResult<PagedResult<RequestItem>>> GetAll([FromQuery] RequestQueryDto query)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isManager = User.IsInRole(Roles.Manager);

        var requests = db.Requests.AsQueryable();

        if (!isManager)
        {
            requests = requests.Where(x => x.CreatedByUserId == userId);
        }

        if (query.Status.HasValue)
            requests = requests.Where(x => x.Status == query.Status.Value);
        if (query.Priority.HasValue)
            requests = requests.Where(x => x.Priority == query.Priority.Value);
        if (query.DeadlineFrom.HasValue)
            requests = requests.Where(x => x.Deadline >= query.DeadlineFrom.Value);
        if (query.DeadlineTo.HasValue)
            requests = requests.Where(x => x.Deadline <= query.DeadlineTo.Value);
        if (!string.IsNullOrWhiteSpace(query.TitleSearch))
            requests = requests.Where(x => x.Title.ToLower().Contains(query.TitleSearch.ToLower()));

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var totalCount = await requests.CountAsync();
        var items = await requests
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<RequestItem>(items, page, pageSize, totalCount));
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

        var request = new RequestItem
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Deadline = dto.Deadline,
            Status = dto.Status,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Requests.Add(request);
        db.RequestStatusHistory.Add(new RequestStatusHistory
        {
            RequestId = request.Id,
            OldStatus = dto.Status,
            NewStatus = dto.Status,
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

        request.Title = dto.Title;
        request.Description = dto.Description;
        request.Priority = dto.Priority;
        request.Deadline = dto.Deadline;
        request.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(request);
    }

    [HttpPost("{id:guid}/status")]
    public async Task<ActionResult> ChangeStatus(Guid id, RequestStatusChangeDto dto)
    {
        var request = await db.Requests.FirstOrDefaultAsync(x => x.Id == id);
        if (request is null) return NotFound();
        if (!CanAccessRequest(request)) return Forbid();

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

    private bool CanAccessRequest(RequestItem request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return User.IsInRole(Roles.Manager) || request.CreatedByUserId == userId;
    }
}
