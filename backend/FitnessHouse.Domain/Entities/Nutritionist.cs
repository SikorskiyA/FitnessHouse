using FitnessHouse.Domain.Entities;

namespace FitnessHouse.Domain.Entities;

public class Nutritionist
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public string Specialization { get; set; } = string.Empty;
    public string? Bio { get; set; }

    public ICollection<Slot> Slots { get; set; } = new List<Slot>();
    public ICollection<Consultation> Consultations { get; set; } = new List<Consultation>();
}