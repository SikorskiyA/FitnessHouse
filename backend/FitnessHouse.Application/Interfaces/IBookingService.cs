using FitnessHouse.Application.DTOs.Bookings;

namespace FitnessHouse.Application.Interfaces;

public interface IBookingService
{
    // Клиент записывается на консультацию
    Task<BookingResponse> CreateBookingAsync(Guid clientId, CreateBookingRequest request);

    // Клиент отменяет свою запись
    Task<bool> CancelBookingAsync(Guid bookingId, Guid clientId, CancelBookingRequest request);

    // Клиент смотрит свои записи
    Task<IEnumerable<BookingResponse>> GetClientBookingsAsync(Guid clientId);

    // Нутрициолог смотрит записи к нему
    Task<IEnumerable<BookingResponse>> GetNutritionistBookingsAsync(Guid nutritionistId);
}