namespace FitnessHouse.Application.DTOs.Admin;

// Администратор создаёт нутрициолога (не через публичную регистрацию)
public class CreateNutritionistRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string? Bio { get; set; }
}