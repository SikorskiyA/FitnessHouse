namespace FitnessHouse.Application.DTOs.Bookings;

public class CancelBookingRequest
{
    public string? Reason { get; set; }  // Причина отмены (необязательно)
}