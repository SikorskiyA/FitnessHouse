using FitnessHouse.Domain.Enums;

namespace FitnessHouse.Domain.Entities;

public class Consultation
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid NutritionistId { get; set; }
    public Nutritionist Nutritionist { get; set; } = null!;

    public ConsultationStatus Status { get; set; } = ConsultationStatus.Scheduled;
    public string? Notes { get; set; }           // Заметки нутрициолога
    public string? Recommendations { get; set; } // Рекомендации по питанию
    public DateTime? CompletedAt { get; set; }   // Когда была проведена
}