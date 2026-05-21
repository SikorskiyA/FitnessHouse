using FitnessHouse.Domain.Entities;

namespace FitnessHouse.Domain.Entities;

public class Client
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public string? Goal { get; set; }
    public DateTime? DateOfBirth { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Consultation> Consultations { get; set; } = new List<Consultation>();
}