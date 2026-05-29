using FitnessHouse.Domain.Enums;
using FitnessHouse.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace FitnessHouse.Infrastructure.Data;

public static class DbSeeder
{
    // Вызывается один раз при старте приложения
    // Создаёт роли и admin-аккаунт если их ещё нет
    public static async Task SeedAsync(
        RoleManager<IdentityRole<Guid>> roleManager,
        UserManager<AppUser> userManager,
        AppDbContext context)
    {
        // 1. Создаём роли если не существуют
        foreach (var role in UserRole.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }

        // 2. Создаём администратора по умолчанию
        const string adminEmail = "admin@fitnesshouse.ru";

        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new AppUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Главный",
                LastName = "Администратор",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, "Admin123!");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, UserRole.Admin);
        }

                // Создаём тестового нутрициолога
        const string nutritionistEmail = "nutritionist@fitnesshouse.ru";

        if (await userManager.FindByEmailAsync(nutritionistEmail) is null)
        {
            var nutritionistUser = new AppUser
            {
                UserName = nutritionistEmail,
                Email = nutritionistEmail,
                FirstName = "Мария",
                LastName = "Петрова",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(nutritionistUser, "Nutri123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(nutritionistUser, UserRole.Nutritionist);

                // Создаём профиль нутрициолога
                var nutritionist = new FitnessHouse.Domain.Entities.Nutritionist
                {
                    Id = Guid.NewGuid(),
                    UserId = nutritionistUser.Id,
                    Specialization = "Спортивное питание",
                    Bio = "Специалист по спортивному питанию с опытом работы 5 лет"
                };
                await context.Nutritionists.AddAsync(nutritionist);
                await context.SaveChangesAsync();
            }
        }
    }
}