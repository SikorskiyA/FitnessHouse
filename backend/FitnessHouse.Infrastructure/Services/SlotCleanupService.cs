using FitnessHouse.Domain.Enums;
using FitnessHouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FitnessHouse.Infrastructure.Services;

// BackgroundService — это фоновая служба ASP.NET Core
// Запускается автоматически вместе с приложением и работает постоянно
public class SlotCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SlotCleanupService> _logger;

    // Интервал очистки — каждые 30 минут
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(30);

    public SlotCleanupService(IServiceScopeFactory scopeFactory, ILogger<SlotCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Служба очистки слотов запущена");

        // Запускаем очистку сразу при старте
        await CleanupExpiredSlotsAsync();

        // Затем повторяем каждые 30 минут
        using var timer = new PeriodicTimer(_interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await CleanupExpiredSlotsAsync();
        }
    }

    private async Task CleanupExpiredSlotsAsync()
    {
        try
        {
            // BackgroundService не может использовать Scoped сервисы напрямую
            // Поэтому создаём новый scope для каждого запуска
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var now = DateTime.UtcNow;

            // Находим все свободные слоты у которых время окончания уже прошло
            var expiredSlots = await context
                .Slots.Where(s => s.Status == SlotStatus.Available && s.EndTime < now)
                .ToListAsync();

            if (expiredSlots.Count == 0)
            {
                _logger.LogInformation("Просроченных слотов не найдено");
                return;
            }

            // Помечаем как отменённые
            foreach (var slot in expiredSlots)
                slot.Status = SlotStatus.Cancelled;

            await context.SaveChangesAsync();

            _logger.LogInformation("Очищено просроченных слотов: {Count}", expiredSlots.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при очистке просроченных слотов");
        }
    }
}
