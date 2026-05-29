using FitnessHouse.Domain.Enums;

namespace FitnessHouse.Application.DTOs.Slots;

public class SlotResponse
{
    public Guid Id { get; set; }
    public Guid NutritionistId { get; set; }
    public string NutritionistName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public SlotStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
}