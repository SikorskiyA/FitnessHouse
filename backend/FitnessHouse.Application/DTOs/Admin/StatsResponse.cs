namespace FitnessHouse.Application.DTOs.Admin;

public class StatsResponse
{
    public int TotalClients { get; set; }
    public int TotalNutritionists { get; set; }
    public int TotalBookings { get; set; }
    public int ActiveBookings { get; set; }
    public int CompletedConsultations { get; set; }
    public int CancelledBookings { get; set; }
    public int AvailableSlots { get; set; }
    public DateTime PeriodFrom { get; set; }
    public DateTime PeriodTo { get; set; }
}