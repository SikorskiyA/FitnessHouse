using System.Security.Claims;
using FitnessHouse.Application.DTOs.Bookings;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly AppDbContext _context;

    public BookingsController(IBookingService bookingService, AppDbContext context)
    {
        _bookingService = bookingService;
        _context = context;
    }

    // POST api/bookings — клиент записывается на консультацию
    [HttpPost]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        var clientId = await GetCurrentClientIdAsync();
        if (clientId is null)
            return NotFound(new { message = "Профиль клиента не найден" });

        try
        {
            var booking = await _bookingService.CreateBookingAsync(clientId.Value, request);
            return CreatedAtAction(nameof(GetMyBookings), new { id = booking.Id }, booking);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET api/bookings/my — клиент смотрит свои записи
    [HttpGet("my")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMyBookings()
    {
        var clientId = await GetCurrentClientIdAsync();
        if (clientId is null)
            return NotFound(new { message = "Профиль клиента не найден" });

        var bookings = await _bookingService.GetClientBookingsAsync(clientId.Value);
        return Ok(bookings);
    }

    // DELETE api/bookings/{id} — клиент отменяет запись
    [HttpDelete("{id}")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingRequest request)
    {
        var clientId = await GetCurrentClientIdAsync();
        if (clientId is null)
            return NotFound(new { message = "Профиль клиента не найден" });

        try
        {
            var result = await _bookingService.CancelBookingAsync(id, clientId.Value, request);
            if (!result)
                return NotFound(new { message = "Запись не найдена" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET api/bookings/nutritionist — нутрициолог смотрит записи к нему
    [HttpGet("nutritionist")]
    [Authorize(Roles = "Nutritionist")]
    public async Task<IActionResult> GetNutritionistBookings()
    {
        var nutritionistId = await GetCurrentNutritionistIdAsync();
        if (nutritionistId is null)
            return NotFound(new { message = "Профиль нутрициолога не найден" });

        var bookings = await _bookingService.GetNutritionistBookingsAsync(nutritionistId.Value);
        return Ok(bookings);
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
        var nutritionist = await _context.Nutritionists.FirstOrDefaultAsync(n => n.UserId == userId);
        return nutritionist?.Id;
    }
}