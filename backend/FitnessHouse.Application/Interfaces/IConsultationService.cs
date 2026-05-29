using FitnessHouse.Application.DTOs.Consultations;

namespace FitnessHouse.Application.Interfaces;

public interface IConsultationService
{
    // Клиент смотрит свою историю консультаций
    Task<IEnumerable<ConsultationResponse>> GetClientHistoryAsync(Guid clientId);

    // Нутрициолог смотрит свои консультации
    Task<IEnumerable<ConsultationResponse>> GetNutritionistConsultationsAsync(Guid nutritionistId);

    // Нутрициолог обновляет статус и заметки
    Task<ConsultationResponse> UpdateConsultationAsync(Guid consultationId, Guid nutritionistId, UpdateConsultationRequest request);

    // Получить одну консультацию по ID
    Task<ConsultationResponse?> GetByIdAsync(Guid consultationId, Guid userId);
}