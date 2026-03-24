using Microsoft.EntityFrameworkCore;
using RequestManager.Api.Data;
using RequestManager.Api.Models;

namespace RequestManager.Api.Jobs;

public class OverdueRequestsJob(AppDbContext db)
{
    public async Task ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        var targets = await db.Requests
            .Where(x => x.Deadline < now && x.Status != RequestStatus.Done && x.Status != RequestStatus.Cancelled && x.Status != RequestStatus.Overdue)
            .ToListAsync();

        foreach (var request in targets)
        {
            var oldStatus = request.Status;
            request.Status = RequestStatus.Overdue;
            request.UpdatedAt = now;

            db.RequestStatusHistory.Add(new RequestStatusHistory
            {
                RequestId = request.Id,
                OldStatus = oldStatus,
                NewStatus = RequestStatus.Overdue,
                ChangedAt = now,
                ChangedByUserId = "system",
                Comment = "Automatically marked as overdue."
            });
        }

        if (targets.Count > 0)
        {
            await db.SaveChangesAsync();
        }
    }
}
