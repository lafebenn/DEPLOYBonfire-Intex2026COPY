using Bonfire.API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();
    public DbSet<MlPrediction> MlPredictions => Set<MlPrediction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(e =>
        {
            e.HasOne(u => u.LinkedSupporter)
                .WithMany(s => s.LinkedUsers)
                .HasForeignKey(u => u.LinkedSupporterId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PartnerAssignment>(e =>
        {
            e.HasOne(pa => pa.Partner)
                .WithMany(p => p.Assignments)
                .HasForeignKey(pa => pa.PartnerId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(pa => pa.Safehouse)
                .WithMany(s => s.PartnerAssignments)
                .HasForeignKey(pa => pa.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Donation>(e =>
        {
            e.HasOne(d => d.Supporter)
                .WithMany(s => s.Donations)
                .HasForeignKey(d => d.SupporterId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(d => d.CreatedByPartner)
                .WithMany(p => p.DonationsCreated)
                .HasForeignKey(d => d.CreatedByPartnerId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(d => d.ReferralPost)
                .WithMany(p => p.DonationsReferring)
                .HasForeignKey(d => d.ReferralPostId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<InKindDonationItem>(e =>
        {
            e.HasOne(i => i.Donation)
                .WithMany(d => d.InKindItems)
                .HasForeignKey(i => i.DonationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DonationAllocation>(e =>
        {
            e.HasOne(a => a.Donation)
                .WithMany(d => d.Allocations)
                .HasForeignKey(a => a.DonationId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(a => a.Safehouse)
                .WithMany(s => s.DonationAllocations)
                .HasForeignKey(a => a.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Resident>(e =>
        {
            e.HasOne(r => r.Safehouse)
                .WithMany(s => s.Residents)
                .HasForeignKey(r => r.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProcessRecording>(e =>
        {
            e.HasOne(x => x.Resident)
                .WithMany(r => r.ProcessRecordings)
                .HasForeignKey(x => x.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HomeVisitation>(e =>
        {
            e.HasOne(x => x.Resident)
                .WithMany(r => r.HomeVisitations)
                .HasForeignKey(x => x.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EducationRecord>(e =>
        {
            e.HasOne(x => x.Resident)
                .WithMany(r => r.EducationRecords)
                .HasForeignKey(x => x.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HealthWellbeingRecord>(e =>
        {
            e.HasOne(x => x.Resident)
                .WithMany(r => r.HealthRecords)
                .HasForeignKey(x => x.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InterventionPlan>(e =>
        {
            e.HasOne(x => x.Resident)
                .WithMany(r => r.InterventionPlans)
                .HasForeignKey(x => x.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IncidentReport>(e =>
        {
            e.HasOne(x => x.Resident)
                .WithMany(r => r.IncidentReports)
                .HasForeignKey(x => x.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Safehouse)
                .WithMany(s => s.IncidentReports)
                .HasForeignKey(x => x.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SafehouseMonthlyMetric>(e =>
        {
            e.HasOne(m => m.Safehouse)
                .WithMany(s => s.MonthlyMetrics)
                .HasForeignKey(m => m.SafehouseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MlPrediction>(e =>
        {
            e.HasIndex(p => new { p.PredictionType, p.EntityType, p.EntityId, p.PredictedAt });
        });
    }
}
