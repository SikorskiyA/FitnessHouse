namespace FitnessHouse.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }       // Кто совершил действие
    public string Action { get; set; } = string.Empty;    // Что сделал: "BookingCreated"
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? Details { get; set; }    // JSON с деталями (старые/новые значения)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
}