using FitnessHouse.Domain.Entities;

namespace FitnessHouse.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(AppUser user, string role);
}