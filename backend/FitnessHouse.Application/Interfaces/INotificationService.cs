namespace FitnessHouse.Application.Interfaces;

public interface INotificationService
{
    // Уведомить конкретного пользователя по его UserId
    Task SendToUserAsync(Guid userId, string type, object payload);
}