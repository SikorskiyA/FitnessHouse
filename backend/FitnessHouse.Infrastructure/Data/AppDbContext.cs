using FitnessHouse.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Nutritionist> Nutritionists => Set<Nutritionist>();
    public DbSet<Slot> Slots => Set<Slot>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Consultation> Consultations => Set<Consultation>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Slot>(entity =>
        {
            entity.Property(s => s.RowVersion)
                  .IsRowVersion()
                  .IsConcurrencyToken();

            // Уникальность только среди НЕ отменённых слотов
            entity.HasIndex(s => new { s.NutritionistId, s.StartTime })
                  .IsUnique()
                  .HasFilter("\"Status\" != 2"); // 2 = Cancelled
        });

        builder.Entity<Booking>(entity =>
        {
            entity.HasOne(b => b.Slot)
                  .WithOne(s => s.Booking)
                  .HasForeignKey<Booking>(b => b.SlotId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Consultation>(entity =>
        {
            entity.HasOne(c => c.Booking)
                  .WithOne(b => b.Consultation)
                  .HasForeignKey<Consultation>(c => c.BookingId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.UserId).IsRequired(false);
        });
    }
}