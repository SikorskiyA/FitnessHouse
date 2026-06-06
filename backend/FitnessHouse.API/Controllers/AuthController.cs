using FitnessHouse.Application.DTOs.Auth;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Domain.Entities;
using FitnessHouse.Domain.Enums;
using FitnessHouse.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.API.Controllers;

[ApiController]
[Route("api/[controller]")] // Маршрут: api/auth
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly AppDbContext _context;

    public AuthController(
        UserManager<AppUser> userManager,
        IJwtService jwtService,
        AppDbContext context
    )
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _context = context;
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Проверяем не занят ли email
        if (await _userManager.FindByEmailAsync(request.Email) is not null)
            return BadRequest(new { message = "Пользователь с таким email уже существует" });

        // Создаём пользователя
        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.Phone,
            EmailConfirmed = true, // для будущего подтверждения почты
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { message = "Ошибка регистрации", errors });
        }

        // Новый пользователь через публичную регистрацию — всегда клиент
        await _userManager.AddToRoleAsync(user, UserRole.Client);

        // Создаём профиль клиента
        var client = new Client { Id = Guid.NewGuid(), UserId = user.Id };
        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        // Генерируем токен и возвращаем
        var token = _jwtService.GenerateToken(user, UserRole.Client);

        return Ok(
            new AuthResponse
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                UserId = user.Id.ToString(),
                Email = user.Email!,
                FullName = user.FullName,
                Role = UserRole.Client,
            }
        );
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user is null || !user.IsActive)
            return Unauthorized(new { message = "Неверный email или пароль" });

        // Проверяем пароль
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
            return Unauthorized(new { message = "Неверный email или пароль" });

        // Получаем роль пользователя
        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? UserRole.Client;

        var token = _jwtService.GenerateToken(user, role);

        return Ok(
            new AuthResponse
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                UserId = user.Id.ToString(),
                Email = user.Email!,
                FullName = user.FullName,
                Role = role,
            }
        );
    }

    // GET api/auth/me — получить данные текущего пользователя
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize] // Только авторизованные
    public async Task<IActionResult> Me()
    {
        // User.FindFirst — читаем данные прямо из JWT токена, без запроса к БД
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userId is null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? UserRole.Client;

        return Ok(
            new
            {
                userId = user.Id,
                email = user.Email,
                fullName = user.FullName,
                firstName = user.FirstName,
                lastName = user.LastName,
                phone = user.PhoneNumber,
                role,
            }
        );
    }
}
