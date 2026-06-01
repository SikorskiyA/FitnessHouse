namespace FitnessHouse.Application.DTOs.Profile;

public class UpdateProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    // Только для нутрициологов
    public string? Specialization { get; set; }
    public string? Bio { get; set; }
}