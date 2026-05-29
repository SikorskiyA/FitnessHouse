namespace FitnessHouse.Application.DTOs.Auth;

// Ответ сервера после успешного входа или регистрации
public class AuthResponse
{
    public string Token { get; set; } = string.Empty;        // JWT токен
    public DateTime ExpiresAt { get; set; }                  // Когда истекает
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;         // Роль пользователя
}