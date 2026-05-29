using FitnessHouse.Application.DTOs.Admin;
using FitnessHouse.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessHouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // Весь контроллер — только для администратора
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // GET api/admin/stats
    // GET api/admin/stats?from=2026-01-01&to=2026-01-31
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        if (from.HasValue && to.HasValue && from > to)
            return BadRequest(new { message = "Дата начала не может быть позже даты окончания" });

        var stats = await _adminService.GetStatsAsync(from, to);
        return Ok(stats);
    }

    // GET api/admin/users — список всех пользователей
    // GET api/admin/users?role=Client — фильтр по роли
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? role)
    {
        var users = await _adminService.GetUsersAsync(role);
        return Ok(users);
    }

    // PATCH api/admin/users/{id}/active — заблокировать/разблокировать пользователя
    [HttpPatch("users/{id}/active")]
    public async Task<IActionResult> SetUserActive(Guid id, [FromBody] bool isActive)
    {
        var result = await _adminService.SetUserActiveAsync(id, isActive);
        if (!result)
            return NotFound(new { message = "Пользователь не найден" });

        return Ok(new { message = isActive ? "Пользователь активирован" : "Пользователь заблокирован" });
    }

    // POST api/admin/nutritionists — создать нового нутрициолога
    [HttpPost("nutritionists")]
    public async Task<IActionResult> CreateNutritionist([FromBody] CreateNutritionistRequest request)
    {
        try
        {
            var nutritionist = await _adminService.CreateNutritionistAsync(request);
            return CreatedAtAction(nameof(GetUsers), new { role = "Nutritionist" }, nutritionist);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}