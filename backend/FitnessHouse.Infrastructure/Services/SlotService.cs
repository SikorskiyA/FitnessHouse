using FitnessHouse.Application.DTOs.Slots;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Domain.Entities;
using FitnessHouse.Domain.Enums;
using FitnessHouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.Infrastructure.Services;

public class SlotService : ISlotService
{
    private readonly AppDbContext _context;

    public SlotService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SlotResponse>> GetAvailableSlotsAsync(Guid? nutritionistId = null)
    {
        var query = _context.Slots
            .Include(s => s.Nutritionist)
                .ThenInclude(n => n.User)
            .Where(s => s.Status == SlotStatus.Available
                     && s.StartTime > DateTime.UtcNow); // Только будущие слоты

        if (nutritionistId.HasValue)
            query = query.Where(s => s.NutritionistId == nutritionistId.Value);

        var slots = await query.OrderBy(s => s.StartTime).ToListAsync();
        return slots.Select(MapToResponse);
    }

    public async Task<IEnumerable<SlotResponse>> GetNutritionistSlotsAsync(Guid nutritionistId)
    {
        var slots = await _context.Slots
            .Include(s => s.Nutritionist)
                .ThenInclude(n => n.User)
            .Where(s => s.NutritionistId == nutritionistId)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        return slots.Select(MapToResponse);
    }

    public async Task<SlotResponse> CreateSlotAsync(Guid nutritionistId, CreateSlotRequest request)
    {
        // Валидация времени
        if (request.StartTime >= request.EndTime)
            throw new InvalidOperationException("Время начала должно быть раньше времени окончания");

        if (request.StartTime < DateTime.UtcNow)
            throw new InvalidOperationException("Нельзя создать слот в прошлом");

        var duration = request.EndTime - request.StartTime;
        if (duration.TotalMinutes < 30 || duration.TotalHours > 3)
            throw new InvalidOperationException("Длительность консультации: от 30 минут до 3 часов");

        // Проверяем нет ли пересечений с существующими слотами
        var hasConflict = await _context.Slots.AnyAsync(s =>
            s.NutritionistId == nutritionistId &&
            s.Status != SlotStatus.Cancelled &&
            s.StartTime < request.EndTime &&
            s.EndTime > request.StartTime);

        if (hasConflict)
            throw new InvalidOperationException("В это время уже есть слот в расписании");

        var slot = new Slot
        {
            Id = Guid.NewGuid(),
            NutritionistId = nutritionistId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = SlotStatus.Available
        };

        _context.Slots.Add(slot);
        await _context.SaveChangesAsync();

        // Подгружаем данные нутрициолога для ответа
        await _context.Entry(slot)
            .Reference(s => s.Nutritionist)
            .Query()
            .Include(n => n.User)
            .LoadAsync();

        return MapToResponse(slot);
    }

    public async Task<bool> CancelSlotAsync(Guid slotId, Guid nutritionistId)
    {
        var slot = await _context.Slots
            .FirstOrDefaultAsync(s => s.Id == slotId && s.NutritionistId == nutritionistId);

        if (slot is null)
            return false;

        // Нельзя отменить уже занятый слот
        if (slot.Status == SlotStatus.Booked)
            throw new InvalidOperationException("Нельзя отменить слот с активной записью. Сначала отмените запись.");

        slot.Status = SlotStatus.Cancelled;
        await _context.SaveChangesAsync();
        return true;
    }

    // Вспомогательный метод — преобразует сущность в DTO
    private static SlotResponse MapToResponse(Slot slot) => new()
    {
        Id = slot.Id,
        NutritionistId = slot.NutritionistId,
        NutritionistName = slot.Nutritionist?.User?.FullName ?? string.Empty,
        StartTime = slot.StartTime,
        EndTime = slot.EndTime,
        Status = slot.Status,
        StatusName = slot.Status switch
        {
            SlotStatus.Available => "Свободен",
            SlotStatus.Booked    => "Занят",
            SlotStatus.Cancelled => "Отменён",
            _                    => "Неизвестно"
        }
    };
}