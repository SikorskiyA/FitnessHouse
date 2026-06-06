using System.Security.Claims;
using FitnessHouse.Application.DTOs.Profile;
using FitnessHouse.Domain.Entities;
using FitnessHouse.Domain.Enums;
using FitnessHouse.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;

    public ProfileController(UserManager<AppUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    // GET api/profile — получить свой профиль
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? string.Empty;

        // Если нутрициолог — подгружаем его профиль
        object? extra = null;
        if (role == UserRole.Nutritionist)
        {
            var nutritionist = await _context.Nutritionists.FirstOrDefaultAsync(n =>
                n.UserId == userId
            );
            if (nutritionist is not null)
                extra = new { nutritionist.Specialization, nutritionist.Bio };
        }

        return Ok(
            new
            {
                userId = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                fullName = user.FullName,
                email = user.Email,
                phone = user.PhoneNumber,
                role,
                extra,
            }
        );
    }

    // PUT api/profile — обновить профиль
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return NotFound();

        // Обновляем базовые поля
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.Phone;
        await _userManager.UpdateAsync(user);

        // Если нутрициолог — обновляем специализацию и bio
        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains(UserRole.Nutritionist))
        {
            var nutritionist = await _context.Nutritionists.FirstOrDefaultAsync(n =>
                n.UserId == userId
            );
            if (nutritionist is not null)
            {
                if (request.Specialization is not null)
                    nutritionist.Specialization = request.Specialization;
                if (request.Bio is not null)
                    nutritionist.Bio = request.Bio;
                await _context.SaveChangesAsync();
            }
        }

        return Ok(new { message = "Профиль обновлён" });
    }

    // POST api/profile/change-password — сменить пароль
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return NotFound();

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword
        );

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { message = "Ошибка смены пароля", errors });
        }

        return Ok(new { message = "Пароль успешно изменён" });
    }
}
