using FitnessHouse.Domain.Enums;

namespace FitnessHouse.Domain.Entities;

public class Booking
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid SlotId { get; set; }
    public Slot Slot { get; set; } = null!;

    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }   // Когда была отменена (если отменена)
    public string? CancellationReason { get; set; }

    public Consultation? Consultation { get; set; }
}