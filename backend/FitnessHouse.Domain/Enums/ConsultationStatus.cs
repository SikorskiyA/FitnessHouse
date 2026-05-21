namespace FitnessHouse.Domain.Enums;

public enum ConsultationStatus
{
    Scheduled = 0,  // Запланирована
    Completed = 1,  // Проведена
    NoShow = 2,     // Клиент не явился
    Cancelled = 3   // Отменена
}