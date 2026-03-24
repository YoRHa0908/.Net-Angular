using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RequestManager.Api.Models;

namespace RequestManager.Api.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<RequestItem> Requests => Set<RequestItem>();
    public DbSet<RequestStatusHistory> RequestStatusHistory => Set<RequestStatusHistory>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RequestItem>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(4000);
        });

        builder.Entity<RequestStatusHistory>(entity =>
        {
            entity.Property(x => x.Comment).HasMaxLength(1000);
        });
    }
}
