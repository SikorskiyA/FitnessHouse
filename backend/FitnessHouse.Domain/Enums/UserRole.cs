namespace FitnessHouse.Domain.Enums;

public static class UserRole
{
    public const string Admin = "Admin";
    public const string Nutritionist = "Nutritionist";
    public const string Client = "Client";

    public static readonly string[] All = [Admin, Nutritionist, Client];
}