using FitnessHouse.Application.DTOs.Slots;

namespace FitnessHouse.Application.Interfaces;

public interface ISlotService
{
    // Получить все доступные слоты
    Task<IEnumerable<SlotResponse>> GetAvailableSlotsAsync(Guid? nutritionistId = null);

    // Получить слоты конкретного нутрициолога
    Task<IEnumerable<SlotResponse>> GetNutritionistSlotsAsync(Guid nutritionistId);

    // Нутрициолог создаёт новый слот
    Task<SlotResponse> CreateSlotAsync(Guid nutritionistId, CreateSlotRequest request);

    // Нутрициолог отменяет слот
    Task<bool> CancelSlotAsync(Guid slotId, Guid nutritionistId);
}