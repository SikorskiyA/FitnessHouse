using FitnessHouse.Application.Interfaces;
using FitnessHouse.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace FitnessHouse.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUserAsync(Guid userId, string type, object payload)
    {
        // Отправляем в группу конкретного пользователя
        // Группа создаётся в NotificationHub.OnConnectedAsync по userId
        await _hubContext
            .Clients.Group($"user-{userId}")
            .SendAsync(
                "ReceiveNotification",
                new
                {
                    type,
                    payload,
                    createdAt = DateTime.UtcNow,
                }
            );
    }
}
