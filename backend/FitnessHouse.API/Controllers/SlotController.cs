using System.Security.Claims;
using FitnessHouse.Application.DTOs.Slots;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Domain.Enums;
using FitnessHouse.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Все эндпоинты требуют авторизации
public class SlotsController : ControllerBase
{
    private readonly ISlotService _slotService;
    private readonly AppDbContext _context;

    public SlotsController(ISlotService slotService, AppDbContext context)
    {
        _slotService = slotService;
        _context = context;
    }

    // GET api/slots/available — клиент смотрит свободные слоты
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable([FromQuery] Guid? nutritionistId)
    {
        var slots = await _slotService.GetAvailableSlotsAsync(nutritionistId);
        return Ok(slots);
    }

    // GET api/slots/my — нутрициолог смотрит своё расписание
    [HttpGet("my")]
    [Authorize(Roles = "Nutritionist")]
    public async Task<IActionResult> GetMySlots()
    {
        var nutritionistId = await GetCurrentNutritionistIdAsync();
        if (nutritionistId is null)
            return NotFound(new { message = "Профиль нутрициолога не найден" });

        var slots = await _slotService.GetNutritionistSlotsAsync(nutritionistId.Value);
        return Ok(slots);
    }

    // POST api/slots — нутрициолог создаёт слот
    [HttpPost]
    [Authorize(Roles = "Nutritionist")]
    public async Task<IActionResult> CreateSlot([FromBody] CreateSlotRequest request)
    {
        var nutritionistId = await GetCurrentNutritionistIdAsync();
        if (nutritionistId is null)
            return NotFound(new { message = "Профиль нутрициолога не найден" });

        try
        {
            var slot = await _slotService.CreateSlotAsync(nutritionistId.Value, request);
            return CreatedAtAction(nameof(GetAvailable), new { id = slot.Id }, slot);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE api/slots/{id} — нутрициолог отменяет слот
    [HttpDelete("{id}")]
    [Authorize(Roles = "Nutritionist")]
    public async Task<IActionResult> CancelSlot(Guid id)
    {
        var nutritionistId = await GetCurrentNutritionistIdAsync();
        if (nutritionistId is null)
            return NotFound(new { message = "Профиль нутрициолога не найден" });

        try
        {
            var result = await _slotService.CancelSlotAsync(id, nutritionistId.Value);
            if (!result)
                return NotFound(new { message = "Слот не найден" });

            return NoContent(); // 204 — успешно, тела ответа нет
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Вспомогательный метод — получаем ID нутрициолога из токена
    private async Task<Guid?> GetCurrentNutritionistIdAsync()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nutritionist = await _context.Nutritionists
            .FirstOrDefaultAsync(n => n.UserId == userId);
        return nutritionist?.Id;
    }
}