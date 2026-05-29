using FitnessHouse.Domain.Enums;

namespace FitnessHouse.Application.DTOs.Consultations;

// Нутрициолог обновляет консультацию — меняет статус и добавляет заметки
public class UpdateConsultationRequest
{
    public ConsultationStatus Status { get; set; }
    public string? Notes { get; set; }
    public string? Recommendations { get; set; }
}