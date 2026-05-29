namespace FitnessHouse.Application.DTOs.Auth;

// Данные для входа
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}