using FitnessHouse.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NutritionistsController : ControllerBase
{
    private readonly AppDbContext _context;

    public NutritionistsController(AppDbContext context)
    {
        _context = context;
    }

    // GET api/nutritionists — список всех активных нутрициологов
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var nutritionists = await _context.Nutritionists
            .Include(n => n.User)
            .Where(n => n.User.IsActive)
            .OrderBy(n => n.User.LastName)
            .ThenBy(n => n.User.FirstName)
            .Select(n => new
            {
                id = n.Id,
                // Склеиваем имя на стороне БД через EF — без вычисляемого свойства
                fullName = n.User.FirstName + " " + n.User.LastName,
                specialization = n.Specialization,
                bio = n.Bio
            })
            .ToListAsync();

        return Ok(nutritionists);
    }
}