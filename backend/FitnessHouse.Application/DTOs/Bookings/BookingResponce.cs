using FitnessHouse.Domain.Enums;

namespace FitnessHouse.Application.DTOs.Bookings;

public class BookingResponse
{
    public Guid Id { get; set; }
    public Guid SlotId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string NutritionistName { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public BookingStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}