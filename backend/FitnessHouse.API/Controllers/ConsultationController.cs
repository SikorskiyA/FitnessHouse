using System.Security.Claims;
using FitnessHouse.Application.DTOs.Consultations;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConsultationsController : ControllerBase
{
    private readonly IConsultationService _consultationService;
    private readonly AppDbContext _context;

    public ConsultationsController(IConsultationService consultationService, AppDbContext context)
    {
        _consultationService = consultationService;
        _context = context;
    }

    // GET api/consultations/my — клиент смотрит свою историю
    [HttpGet("my")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMyHistory()
    {
        var clientId = await GetCurrentClientIdAsync();
        if (clientId is null)
            return NotFound(new { message = "Профиль клиента не найден" });

        var consultations = await _consultationService.GetClientHistoryAsync(clientId.Value);
        return Ok(consultations);
    }

    // GET api/consultations/nutritionist — нутрициолог смотрит свои консультации
    [HttpGet("nutritionist")]
    [Authorize(Roles = "Nutritionist")]
    public async Task<IActionResult> GetNutritionistConsultations()
    {
        var nutritionistId = await GetCurrentNutritionistIdAsync();
        if (nutritionistId is null)
            return NotFound(new { message = "Профиль нутрициолога не найден" });

        var consultations = await _consultationService.GetNutritionistConsultationsAsync(
            nutritionistId.Value
        );
        return Ok(consultations);
    }

    // GET api/consultations/{id} — получить одну консультацию
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            var consultation = await _consultationService.GetByIdAsync(id, userId);
            if (consultation is null)
                return NotFound(new { message = "Консультация не найдена" });

            return Ok(consultation);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
    }

    // PUT api/consultations/{id} — нутрициолог обновляет статус и заметки
    [HttpPut("{id}")]
    [Authorize(Roles = "Nutritionist")]
    public async Task<IActionResult> UpdateConsultation(
        Guid id,
        [FromBody] UpdateConsultationRequest request
    )
    {
        var nutritionistId = await GetCurrentNutritionistIdAsync();
        if (nutritionistId is null)
            return NotFound(new { message = "Профиль нутрициолога не найден" });

        try
        {
            var consultation = await _consultationService.UpdateConsultationAsync(
                id,
                nutritionistId.Value,
                request
            );
            return Ok(consultation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private async Task<Guid?> GetCurrentClientIdAsync()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId);
        return client?.Id;
    }

    private async Task<Guid?> GetCurrentNutritionistIdAsync()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nutritionist = await _context.Nutritionists.FirstOrDefaultAsync(n =>
            n.UserId == userId
        );
        return nutritionist?.Id;
    }
}
