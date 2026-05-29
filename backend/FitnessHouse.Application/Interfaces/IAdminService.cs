using FitnessHouse.Application.DTOs.Admin;

namespace FitnessHouse.Application.Interfaces;

public interface IAdminService
{
    Task<StatsResponse> GetStatsAsync(DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<UserListResponse>> GetUsersAsync(string? role = null);
    Task<bool> SetUserActiveAsync(Guid userId, bool isActive);
    Task<UserListResponse> CreateNutritionistAsync(CreateNutritionistRequest request);
}