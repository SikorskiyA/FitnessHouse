using FitnessHouse.Domain.Enums;

namespace FitnessHouse.Domain.Entities;

public class Slot
{
    public Guid Id { get; set; }
    public Guid NutritionistId { get; set; }
    public Nutritionist Nutritionist { get; set; } = null!;

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public SlotStatus Status { get; set; } = SlotStatus.Available;

    // Версия для оптимистичной блокировки — предотвращает двойное бронирование
    // EF Core автоматически проверяет эту версию при сохранении
    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[]? RowVersion { get; set; }

    public Booking? Booking { get; set; }  // Если слот занят — здесь будет запись
}