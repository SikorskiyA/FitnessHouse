using FitnessHouse.Application.DTOs.Admin;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Domain.Entities;
using FitnessHouse.Domain.Enums;
using FitnessHouse.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FitnessHouse.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public AdminService(AppDbContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<StatsResponse> GetStatsAsync(DateTime? from = null, DateTime? to = null)
    {
        // Если даты не переданы — берём текущий месяц по умолчанию
        var dateFrom = from ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var dateTo = to ?? dateFrom.AddMonths(1).AddSeconds(-1);

        // Клиенты и нутрициологи — считаем всех зарегистрированных за период
        var totalClients = await _context
            .Clients.Include(c => c.User)
            .CountAsync(c => c.User.CreatedAt >= dateFrom && c.User.CreatedAt <= dateTo);

        var totalNutritionists = await _context
            .Nutritionists.Include(n => n.User)
            .CountAsync(n => n.User.CreatedAt >= dateFrom && n.User.CreatedAt <= dateTo);

        // Записи фильтруем по дате создания
        var totalBookings = await _context.Bookings.CountAsync(b =>
            b.CreatedAt >= dateFrom && b.CreatedAt <= dateTo
        );

        var activeBookings = await _context.Bookings.CountAsync(b =>
            b.Status == BookingStatus.Confirmed && b.CreatedAt >= dateFrom && b.CreatedAt <= dateTo
        );

        var completedConsultations = await _context.Consultations.CountAsync(c =>
            c.Status == ConsultationStatus.Completed
            && c.CompletedAt >= dateFrom
            && c.CompletedAt <= dateTo
        );

        var cancelledBookings = await _context.Bookings.CountAsync(b =>
            b.Status == BookingStatus.Cancelled
            && b.CancelledAt >= dateFrom
            && b.CancelledAt <= dateTo
        );

        // Свободные слоты — показываем те что попадают в период
        var availableSlots = await _context.Slots.CountAsync(s =>
            s.Status == SlotStatus.Available && s.StartTime >= dateFrom && s.StartTime <= dateTo
        );

        return new StatsResponse
        {
            TotalClients = totalClients,
            TotalNutritionists = totalNutritionists,
            TotalBookings = totalBookings,
            ActiveBookings = activeBookings,
            CompletedConsultations = completedConsultations,
            CancelledBookings = cancelledBookings,
            AvailableSlots = availableSlots,
            PeriodFrom = dateFrom,
            PeriodTo = dateTo,
        };
    }

    public async Task<IEnumerable<UserListResponse>> GetUsersAsync(string? role = null)
    {
        // Получаем всех пользователей с их ролями
        var users = await _userManager.Users.ToListAsync();
        var result = new List<UserListResponse>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? string.Empty;

            // Фильтр по роли если передан
            if (role is not null && userRole != role)
                continue;

            result.Add(
                new UserListResponse
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email ?? string.Empty,
                    Phone = user.PhoneNumber ?? string.Empty,
                    Role = userRole,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                }
            );
        }

        return result.OrderBy(u => u.FullName);
    }

    public async Task<bool> SetUserActiveAsync(Guid userId, bool isActive)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return false;

        user.IsActive = isActive;
        await _userManager.UpdateAsync(user);
        return true;
    }

    public async Task<UserListResponse> CreateNutritionistAsync(CreateNutritionistRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email) is not null)
            throw new InvalidOperationException("Пользователь с таким email уже существует");

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.Phone,
            EmailConfirmed = true,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Ошибка создания пользователя: {errors}");
        }

        await _userManager.AddToRoleAsync(user, UserRole.Nutritionist);

        var nutritionist = new Nutritionist
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Specialization = request.Specialization,
            Bio = request.Bio,
        };

        _context.Nutritionists.Add(nutritionist);
        await _context.SaveChangesAsync();

        return new UserListResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email!,
            Phone = user.PhoneNumber ?? string.Empty,
            Role = UserRole.Nutritionist,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
        };
    }
}
