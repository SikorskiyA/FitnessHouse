using System.Text;
using FitnessHouse.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FitnessHouse.Domain.Entities;
using FitnessHouse.Application.Interfaces;
using FitnessHouse.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true); // стандартное время UTC

// --- 1. База данных ---
// Регистрируем AppDbContext с PostgreSQL провайдером
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- 2. Identity (система пользователей и ролей) ---
builder.Services.AddIdentity<AppUser, IdentityRole<Guid>>(options =>
{
    // Настройки паролей (для диплома можно упростить)
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;

    // Email должен быть уникальным
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()  // Хранить пользователей в нашей БД
.AddDefaultTokenProviders();               // Для сброса паролей и подтверждения email

// --- 3. JWT аутентификация ---
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,           // Проверять срок действия токена
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };

    // Для SignalR — токен передаётся через query string, не через заголовок
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddHostedService<SlotCleanupService>();

builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ISlotService, SlotService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IConsultationService, ConsultationService>();
builder.Services.AddScoped<IAdminService, AdminService>();

// --- 4. CORS — разрешаем React приложению обращаться к API ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")  // Стандартный порт Vite
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();  // Нужно для SignalR
    });
});

// --- 5. SignalR (уведомления в реальном времени) ---
builder.Services.AddSignalR();

// --- 6. Контроллеры и Swagger ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FitnessHouse API",
        Version = "v1",
        Description = "АИС управления расписанием нутрициолога"
    });

    // Добавляем кнопку Authorize в Swagger UI для тестирования JWT
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Введите: Bearer {токен}"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// --- Middleware pipeline (порядок важен!) ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");       // CORS должен быть до аутентификации
app.UseAuthentication();          // Сначала определяем кто это
app.UseAuthorization();           // Потом проверяем что ему можно

app.MapControllers();
app.MapHub<FitnessHouse.API.Hubs.NotificationHub>("/hubs/notifications");

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(roleManager, userManager, context);
}

app.Run();