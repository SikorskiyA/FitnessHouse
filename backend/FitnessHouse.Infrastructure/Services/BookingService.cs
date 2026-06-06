using FitnessHouse.Application.DTOs.Bookings;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Domain.Entities;
using FitnessHouse.Domain.Enums;
using FitnessHouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public BookingService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<BookingResponse> CreateBookingAsync(
        Guid clientId,
        CreateBookingRequest request
    )
    {
        // Используем транзакцию — если что-то пойдёт не так, все изменения откатятся
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Загружаем слот с блокировкой — никто другой не сможет его изменить
            // пока мы не завершим транзакцию
            var slot = await _context
                .Slots.Include(s => s.Nutritionist)
                    .ThenInclude(n => n.User)
                .FirstOrDefaultAsync(s => s.Id == request.SlotId);

            if (slot is null)
                throw new InvalidOperationException("Слот не найден");

            if (slot.Status != SlotStatus.Available)
                throw new InvalidOperationException("Этот слот уже занят или отменён");

            if (slot.StartTime < DateTime.UtcNow)
                throw new InvalidOperationException("Нельзя записаться на прошедшее время");

            // Проверяем нет ли у клиента уже записи на это время
            var hasConflict = await _context
                .Bookings.Include(b => b.Slot)
                .AnyAsync(b =>
                    b.ClientId == clientId
                    && b.Status == BookingStatus.Confirmed
                    && b.Slot.StartTime < slot.EndTime
                    && b.Slot.EndTime > slot.StartTime
                );

            if (hasConflict)
                throw new InvalidOperationException("У вас уже есть запись на это время");

            // Меняем статус слота на "Занят"
            slot.Status = SlotStatus.Booked;

            // Создаём запись
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                ClientId = clientId,
                SlotId = slot.Id,
                Status = BookingStatus.Confirmed,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Bookings.Add(booking);

            // Создаём консультацию сразу — она будет в статусе Scheduled
            var consultation = new Consultation
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                ClientId = clientId,
                NutritionistId = slot.NutritionistId,
                Status = ConsultationStatus.Scheduled,
            };

            _context.Consultations.Add(consultation);

            try
            {
                // SaveChanges здесь может выбросить DbUpdateConcurrencyException
                // если другой пользователь успел забронировать этот слот одновременно
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Оптимистичная блокировка сработала — слот уже занят
                await transaction.RollbackAsync();
                throw new InvalidOperationException(
                    "Этот слот только что забронировал другой пользователь. Пожалуйста, выберите другое время."
                );
            }

            // Подгружаем клиента для ответа
            var client = await _context
                .Clients.Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == clientId);

            // Отправляем уведомление нутрициологу
            await _notificationService.SendToUserAsync(
                slot.Nutritionist.User.Id,
                "NewBooking",
                new
                {
                    message = $"Новая запись: {client?.User?.FullName} на {slot.StartTime:dd.MM.yyyy HH:mm}",
                    clientName = client?.User?.FullName,
                    startTime = slot.StartTime,
                    bookingId = booking.Id,
                }
            );

            return MapToResponse(booking, slot, client);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> CancelBookingAsync(
        Guid bookingId,
        Guid clientId,
        CancelBookingRequest request
    )
    {
        var booking = await _context
            .Bookings.Include(b => b.Slot)
            .Include(b => b.Consultation)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.ClientId == clientId);

        if (booking is null)
            return false;

        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException("Можно отменить только подтверждённую запись");

        // Политика отмены — не позже чем за 12 часов
        var hoursUntilConsultation = (booking.Slot.StartTime - DateTime.UtcNow).TotalHours;
        if (hoursUntilConsultation < 12)
            throw new InvalidOperationException(
                "Отмена возможна не позже чем за 12 часов до начала консультации"
            );

        // Отменяем запись
        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancellationReason = request.Reason;

        // Освобождаем слот
        booking.Slot.Status = SlotStatus.Available;

        // Отменяем консультацию
        if (booking.Consultation is not null)
            booking.Consultation.Status = ConsultationStatus.Cancelled;

        await _context.SaveChangesAsync();

        // Уведомляем нутрициолога об отмене
        var nutritionistUser = await _context
            .Nutritionists.Include(n => n.User)
            .Where(n => n.Id == booking.Slot.NutritionistId)
            .Select(n => n.User)
            .FirstOrDefaultAsync();

        var clientUser = await _context
            .Clients.Include(c => c.User)
            .Where(c => c.Id == clientId)
            .Select(c => c.User)
            .FirstOrDefaultAsync();

        if (nutritionistUser != null)
        {
            await _notificationService.SendToUserAsync(
                nutritionistUser.Id,
                "BookingCancelled",
                new
                {
                    message = $"Отмена записи: {clientUser?.FullName} на {booking.Slot.StartTime:dd.MM.yyyy HH:mm}",
                    clientName = clientUser?.FullName,
                    startTime = booking.Slot.StartTime,
                    bookingId = booking.Id,
                }
            );
        }

        return true;
    }

    public async Task<IEnumerable<BookingResponse>> GetClientBookingsAsync(Guid clientId)
    {
        var bookings = await _context
            .Bookings.Include(b => b.Slot)
                .ThenInclude(s => s.Nutritionist)
                    .ThenInclude(n => n.User)
            .Include(b => b.Client)
                .ThenInclude(c => c.User)
            .Where(b => b.ClientId == clientId)
            .OrderByDescending(b => b.Slot.StartTime)
            .ToListAsync();

        return bookings.Select(b => MapToResponse(b, b.Slot, b.Client));
    }

    public async Task<IEnumerable<BookingResponse>> GetNutritionistBookingsAsync(
        Guid nutritionistId
    )
    {
        var bookings = await _context
            .Bookings.Include(b => b.Slot)
                .ThenInclude(s => s.Nutritionist)
                    .ThenInclude(n => n.User)
            .Include(b => b.Client)
                .ThenInclude(c => c.User)
            .Where(b => b.Slot.NutritionistId == nutritionistId)
            .OrderByDescending(b => b.Slot.StartTime)
            .ToListAsync();

        return bookings.Select(b => MapToResponse(b, b.Slot, b.Client));
    }

    private static BookingResponse MapToResponse(Booking booking, Slot slot, Client? client) =>
        new()
        {
            Id = booking.Id,
            SlotId = slot.Id,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            NutritionistName = slot.Nutritionist?.User?.FullName ?? string.Empty,
            ClientName = client?.User?.FullName ?? string.Empty,
            ClientPhone = client?.User?.PhoneNumber ?? string.Empty,
            ClientEmail = client?.User?.Email ?? string.Empty,
            Status = booking.Status,
            StatusName = booking.Status switch
            {
                BookingStatus.Confirmed => "Подтверждена",
                BookingStatus.Cancelled => "Отменена",
                BookingStatus.Completed => "Завершена",
                _ => "Неизвестно",
            },
            CreatedAt = booking.CreatedAt,
        };
}
