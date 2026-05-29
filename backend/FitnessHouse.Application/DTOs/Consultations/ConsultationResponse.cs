using FitnessHouse.Domain.Enums;

namespace FitnessHouse.Application.DTOs.Consultations;

public class ConsultationResponse
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string NutritionistName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public ConsultationStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? Recommendations { get; set; }
    public DateTime? CompletedAt { get; set; }
}