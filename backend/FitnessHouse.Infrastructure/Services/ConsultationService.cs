using FitnessHouse.Application.DTOs.Consultations;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Domain.Entities;
using FitnessHouse.Domain.Enums;
using FitnessHouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.Infrastructure.Services;

public class ConsultationService : IConsultationService
{
    private readonly AppDbContext _context;

    public ConsultationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ConsultationResponse>> GetClientHistoryAsync(Guid clientId)
    {
        var consultations = await _context
            .Consultations.Include(c => c.Booking)
                .ThenInclude(b => b.Slot)
            .Include(c => c.Client)
                .ThenInclude(c => c.User)
            .Include(c => c.Nutritionist)
                .ThenInclude(n => n.User)
            .Where(c => c.ClientId == clientId)
            .OrderByDescending(c => c.Booking.Slot.StartTime)
            .ToListAsync();

        return consultations.Select(MapToResponse);
    }

    public async Task<IEnumerable<ConsultationResponse>> GetNutritionistConsultationsAsync(
        Guid nutritionistId
    )
    {
        var consultations = await _context
            .Consultations.Include(c => c.Booking)
                .ThenInclude(b => b.Slot)
            .Include(c => c.Client)
                .ThenInclude(c => c.User)
            .Include(c => c.Nutritionist)
                .ThenInclude(n => n.User)
            .Where(c => c.NutritionistId == nutritionistId)
            .OrderByDescending(c => c.Booking.Slot.StartTime)
            .ToListAsync();

        return consultations.Select(MapToResponse);
    }

    public async Task<ConsultationResponse> UpdateConsultationAsync(
        Guid consultationId,
        Guid nutritionistId,
        UpdateConsultationRequest request
    )
    {
        var consultation = await _context
            .Consultations.Include(c => c.Booking)
                .ThenInclude(b => b.Slot)
            .Include(c => c.Client)
                .ThenInclude(c => c.User)
            .Include(c => c.Nutritionist)
                .ThenInclude(n => n.User)
            .FirstOrDefaultAsync(c => c.Id == consultationId && c.NutritionistId == nutritionistId);

        if (consultation is null)
            throw new InvalidOperationException("Консультация не найдена");

        var allowedTransitions = new Dictionary<ConsultationStatus, List<ConsultationStatus>>
        {
            [ConsultationStatus.Scheduled] =
            [
                ConsultationStatus.Completed,
                ConsultationStatus.NoShow,
                ConsultationStatus.Cancelled,
            ],
            [ConsultationStatus.Completed] = [], // Проведённую консультацию нельзя отменить
            [ConsultationStatus.NoShow] = [],
            [ConsultationStatus.Cancelled] = [],
        };

        var allowed = allowedTransitions[consultation.Status];
        if (!allowed.Contains(request.Status))
            throw new InvalidOperationException(
                $"Нельзя перевести консультацию из статуса '{GetStatusName(consultation.Status)}' "
                    + $"в статус '{GetStatusName(request.Status)}'"
            );

        // Обновляем поля
        consultation.Status = request.Status;
        consultation.Notes = request.Notes;
        consultation.Recommendations = request.Recommendations;

        if (request.Status == ConsultationStatus.Completed)
        {
            consultation.CompletedAt = DateTime.UtcNow;

            // Обновляем статус записи на "Завершена"
            consultation.Booking.Status = BookingStatus.Completed;
        }

        await _context.SaveChangesAsync();
        return MapToResponse(consultation);
    }

    public async Task<ConsultationResponse?> GetByIdAsync(Guid consultationId, Guid userId)
    {
        var consultation = await _context
            .Consultations.Include(c => c.Booking)
                .ThenInclude(b => b.Slot)
            .Include(c => c.Client)
                .ThenInclude(c => c.User)
            .Include(c => c.Nutritionist)
                .ThenInclude(n => n.User)
            .FirstOrDefaultAsync(c => c.Id == consultationId);

        if (consultation is null)
            return null;

        // Проверяем что пользователь имеет доступ — только участники консультации
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId);
        var nutritionist = await _context.Nutritionists.FirstOrDefaultAsync(n =>
            n.UserId == userId
        );

        var isClient = client is not null && consultation.ClientId == client.Id;
        var isNutritionist =
            nutritionist is not null && consultation.NutritionistId == nutritionist.Id;

        if (!isClient && !isNutritionist)
            throw new UnauthorizedAccessException("Нет доступа к этой консультации");

        return MapToResponse(consultation);
    }

    private static string GetStatusName(ConsultationStatus status) =>
        status switch
        {
            ConsultationStatus.Scheduled => "Запланирована",
            ConsultationStatus.Completed => "Проведена",
            ConsultationStatus.NoShow => "Неявка",
            ConsultationStatus.Cancelled => "Отменена",
            _ => "Неизвестно",
        };

    private static ConsultationResponse MapToResponse(Consultation c) =>
        new()
        {
            Id = c.Id,
            BookingId = c.BookingId,
            ClientName = c.Client?.User?.FullName ?? string.Empty,
            ClientPhone = c.Client?.User?.PhoneNumber ?? string.Empty,
            ClientEmail = c.Client?.User?.Email ?? string.Empty,
            NutritionistName = c.Nutritionist?.User?.FullName ?? string.Empty,
            StartTime = c.Booking?.Slot?.StartTime ?? default,
            EndTime = c.Booking?.Slot?.EndTime ?? default,
            Status = c.Status,
            StatusName = GetStatusName(c.Status),
            Notes = c.Notes,
            Recommendations = c.Recommendations,
            CompletedAt = c.CompletedAt,
        };
}
