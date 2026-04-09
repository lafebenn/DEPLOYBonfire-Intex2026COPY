using Bonfire.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Data;

/// <summary>
/// Idempotent demo narrative for presentations: Maria S. (trafficking survivor, police referral, High → Medium risk)
/// plus a recurring congregational donor. Enable with environment variable SEED_PRESENTATION_DATA=true or SeedPresentationData in configuration.
/// Re-running replaces only rows tagged with the presentation marker (safe for Azure).
/// </summary>
public static class PresentationStorySeeder
{
    private const string Marker = "[bonfire-presentation-seed]";
    private const string MariaCaseControl = "WCPC-2026-014";
    private const string MariaInternalCode = "Maria S.";
    private const string CongregationEmail = "monthlygiving@hopefellowship-presentation.org";

    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var utcNow = DateTime.UtcNow;

        var safehouse = await db.Safehouses
            .Where(s => s.Status == "Active")
            .OrderBy(s => s.SafehouseId)
            .FirstOrDefaultAsync();
        safehouse ??= await db.Safehouses.OrderBy(s => s.SafehouseId).FirstOrDefaultAsync();
        if (safehouse == null)
        {
            safehouse = new Safehouse
            {
                SafehouseCode = "PRES-01",
                Name = "Bonfire Presentation Safe Home",
                Region = "Davao",
                City = "Davao City",
                Province = "Davao del Sur",
                Country = "Philippines",
                OpenDate = today.AddYears(-2),
                Status = "Active",
                CapacityGirls = 24,
                CapacityStaff = 8,
                CurrentOccupancy = 1,
                Notes = $"{Marker} Created for presentation seed."
            };
            db.Safehouses.Add(safehouse);
            await db.SaveChangesAsync();
            logger.LogInformation("Presentation seed: created safehouse {Name} (Id {Id}).", safehouse.Name, safehouse.SafehouseId);
        }

        var maria = await db.Residents.FirstOrDefaultAsync(r => r.CaseControlNo == MariaCaseControl);
        if (maria == null)
        {
            maria = new Resident { CaseControlNo = MariaCaseControl, CreatedAt = utcNow };
            db.Residents.Add(maria);
        }

        var dob = today.AddYears(-14);
        maria.InternalCode = MariaInternalCode;
        maria.SafehouseId = safehouse.SafehouseId;
        maria.CaseStatus = "Active";
        maria.Sex = "F";
        maria.DateOfBirth = dob;
        maria.BirthStatus = "Single";
        maria.PlaceOfBirth = "Davao del Sur, Philippines";
        maria.Religion = "Christian";
        maria.CaseCategory = "Trafficked";
        maria.SubCatTrafficked = true;
        maria.SubCatSexualAbuse = false;
        maria.SubCatPhysicalAbuse = false;
        maria.SubCatOrphaned = false;
        maria.SubCatChildLabor = false;
        maria.SubCatOsaec = false;
        maria.SubCatCicl = false;
        maria.SubCatAtRisk = false;
        maria.SubCatStreetChild = false;
        maria.SubCatChildWithHiv = false;
        maria.IsPwd = false;
        maria.HasSpecialNeeds = true;
        maria.SpecialNeedsDiagnosis = "Trauma-related anxiety; sleep disruption (stabilizing with care plan).";
        maria.FamilyIs4ps = true;
        maria.FamilySoloParent = true;
        maria.FamilyIndigenous = false;
        maria.FamilyParentPwd = false;
        maria.FamilyInformalSettler = false;
        maria.DateOfAdmission = today.AddDays(-40);
        maria.DateEnrolled = maria.DateOfAdmission;
        maria.ReferralSource = "Police";
        maria.ReferringAgencyPerson = "Women and Children Protection Center (WCPC), referral after recovery operation";
        maria.AssignedSocialWorker = "Ana Reyes";
        maria.InitialCaseAssessment =
            "Maria, 14, arrived following a police-led recovery. Initial safety screening complete; High case risk at intake. " +
            "Trauma-informed counseling, education re-entry, and legal accompaniment are underway.";
        maria.ReintegrationType = "Family reunification (long-term)";
        maria.ReintegrationStatus = "In progress";
        maria.InitialRiskLevel = "High";
        maria.CurrentRiskLevel = "Medium";
        maria.DateClosed = null;
        maria.NotesRestricted = $"{Marker} Presentation profile; fictionalized composite for demo.";

        await db.SaveChangesAsync();
        var mariaId = maria.ResidentId;

        await RemoveMariaSeedRowsAsync(db, mariaId);
        await RemoveCongregationSeedDonationsAsync(db);

        // Process recordings: emotional arc over the last ~30 days (story of stabilization and hope).
        var sessions = new[]
        {
            (
                DayOffset: -28,
                Observed: "withdrawn, fearful, minimal speech",
                End: "quiet, guarded, would not discuss home",
                Narrative:
                    "Intake stabilization session. Maria confirmed understanding of house rules and safety plan. " +
                    "She remained hypervigilant but accepted a grounding exercise. Next: weekly counseling and education assessment.",
                Concerns: true,
                Progress: false
            ),
            (
                DayOffset: -21,
                Observed: "anxious, restless",
                End: "somewhat calmer, brief eye contact",
                Narrative:
                    "Trauma-focused session (psychoeducation on trauma responses). Maria named one coping strategy she used at night. " +
                    "Staff reinforced sleep hygiene supports.",
                Concerns: true,
                Progress: true
            ),
            (
                DayOffset: -14,
                Observed: "tired but cooperative",
                End: "engaged, asked questions about school plan",
                Narrative:
                    "Reviewed education pathway and met with learning support liaison. Maria expressed hope about returning to learning " +
                    "with accommodations. Safety planning for triggers reviewed.",
                Concerns: false,
                Progress: true
            ),
            (
                DayOffset: -10,
                Observed: "cautiously positive",
                End: "stable mood, participated in art reflection",
                Narrative:
                    "Creative expression session; Maria shared themes of safety and friendship without graphic detail. " +
                    "Team notes improved rapport and fewer shutdowns.",
                Concerns: false,
                Progress: true
            ),
            (
                DayOffset: -5,
                Observed: "calm, cooperative",
                End: "hopeful, identified a personal goal for the month",
                Narrative:
                    "Strengths-based session. Maria identified a goal around peer mentorship group (observer role). " +
                    "Risk review: case level adjusted toward Medium with continued close monitoring.",
                Concerns: false,
                Progress: true
            ),
            (
                DayOffset: -2,
                Observed: "calm, engaged",
                End: "positive, cooperative, appropriate affect",
                Narrative:
                    "Check-in before case conference. Maria reports improved sleep with routine supports. " +
                    "No acute safety concerns today. Continue counseling and education plan.",
                Concerns: false,
                Progress: true
            )
        };

        foreach (var s in sessions)
        {
            db.ProcessRecordings.Add(new ProcessRecording
            {
                ResidentId = mariaId,
                SessionDate = today.AddDays(s.DayOffset),
                SocialWorker = "Ana Reyes",
                SessionType = "Trauma-informed counseling",
                SessionDurationMinutes = 55,
                EmotionalStateObserved = s.Observed,
                EmotionalStateEnd = s.End,
                SessionNarrative = s.Narrative,
                InterventionsApplied = "Safety planning, grounding, strengths-based reflection",
                FollowUpActions = $"{Marker} Presentation timeline row.",
                ProgressNoted = s.Progress,
                ConcernsFlagged = s.Concerns,
                ReferralMade = false
            });
        }

        // Education: steady improvement in attendance and progress (last 30 days).
        var edu = new[]
        {
            (today.AddDays(-27), 62m, 38m),
            (today.AddDays(-20), 72m, 48m),
            (today.AddDays(-13), 81m, 58m),
            (today.AddDays(-6), 88m, 68m)
        };
        foreach (var (recordDate, attendance, progress) in edu)
        {
            db.EducationRecords.Add(new EducationRecord
            {
                ResidentId = mariaId,
                RecordDate = recordDate,
                ProgramName = "Alternative Learning System support",
                CourseName = "Core academics & life skills",
                EducationLevel = "Junior high equivalent",
                AttendanceStatus = "Present",
                AttendanceRate = attendance,
                ProgressPercent = progress,
                CompletionStatus = "In progress",
                GpaLikeScore = 2.8m + progress / 100m * 0.6m,
                Notes = $"{Marker} Weekly learning check-in."
            });
        }

        // Health: modest gains in wellbeing scores.
        var health = new[]
        {
            (today.AddDays(-25), 48m, 52m, 50m, 52m),
            (today.AddDays(-17), 52m, 55m, 54m, 58m),
            (today.AddDays(-9), 55m, 60m, 58m, 64m)
        };
        for (var hi = 0; hi < health.Length; hi++)
        {
            var (recordDate, nutrition, sleep, energy, general) = health[hi];
            db.HealthWellbeingRecords.Add(new HealthWellbeingRecord
            {
                ResidentId = mariaId,
                RecordDate = recordDate,
                WeightKg = 46m,
                HeightCm = 158m,
                Bmi = 18.4m,
                NutritionScore = nutrition,
                SleepScore = sleep,
                EnergyScore = energy,
                GeneralHealthScore = general,
                MedicalCheckupDone = hi == health.Length - 1,
                DentalCheckupDone = false,
                PsychologicalCheckupDone = true,
                MedicalNotesRestricted = $"{Marker} Routine wellbeing tracking."
            });
        }

        db.HomeVisitations.Add(new HomeVisitation
        {
            ResidentId = mariaId,
            VisitDate = today.AddDays(-12),
            SocialWorker = "Ana Reyes",
            VisitType = "Family contact (supervised)",
            LocationVisited = "Safe home family room",
            FamilyMembersPresent = "Mother (supervised)",
            Purpose = "Supported contact per court/safety plan",
            Observations =
                "Visit remained structured and calm. Maria used coping strategies when discussion became tense. " +
                "Mother cooperative with house rules.",
            FamilyCooperationLevel = "Good",
            SafetyConcernsNoted = false,
            FollowUpNeeded = true,
            FollowUpNotes = $"{Marker} Schedule next supervised visit; continue parallel counseling for guardian.",
            VisitOutcome = "Completed with safety maintained"
        });

        // ML resident risk: trending down within the window (dashboard uses latest).
        db.MlPredictions.Add(new MlPrediction
        {
            PredictionType = "ResidentRiskFlag",
            EntityType = "Resident",
            EntityId = mariaId,
            Score = 0.62m,
            Label = "elevated_monitoring",
            FeaturePayloadJson = """{"seed":"presentation","phase":"early"}""",
            ModelVersion = "presentation-seed-v1",
            PredictedAt = utcNow.AddDays(-20)
        });
        db.MlPredictions.Add(new MlPrediction
        {
            PredictionType = "ResidentRiskFlag",
            EntityType = "Resident",
            EntityId = mariaId,
            Score = 0.41m,
            Label = "moderate",
            FeaturePayloadJson = """{"seed":"presentation","phase":"recent"}""",
            ModelVersion = "presentation-seed-v1",
            PredictedAt = utcNow.AddDays(-1)
        });

        // Congregation: monthly rhythm in the last 30 days (four weekly gifts).
        var congregation = await db.Supporters.FirstOrDefaultAsync(s => s.Email == CongregationEmail);
        if (congregation == null)
        {
            congregation = new Supporter
            {
                SupporterType = "MonetaryDonor",
                DisplayName = "Hope Fellowship Church",
                OrganizationName = "Hope Fellowship Church",
                FirstName = null,
                LastName = null,
                RelationshipType = "FaithCommunity",
                Region = "Metro Davao",
                Country = "Philippines",
                Email = CongregationEmail,
                Phone = "",
                Status = "Active",
                FirstDonationDate = today.AddDays(-28),
                AcquisitionChannel = "Presentation",
                CreatedAt = utcNow
            };
            db.Supporters.Add(congregation);
            await db.SaveChangesAsync();
        }
        else
        {
            congregation.DisplayName = "Hope Fellowship Church";
            congregation.OrganizationName = "Hope Fellowship Church";
            congregation.RelationshipType = "FaithCommunity";
        }

        var giftDays = new[] { -28, -21, -14, -7 };
        var seededDonations = new List<Donation>();
        foreach (var d in giftDays)
        {
            var donation = new Donation
            {
                SupporterId = congregation.SupporterId,
                DonationType = "Monetary",
                DonationDate = today.AddDays(d),
                ChannelSource = "Bank transfer",
                CurrencyCode = "PHP",
                Amount = 3500m,
                IsRecurring = true,
                CampaignName = "General ministry & residential care",
                Notes = $"{Marker} Monthly congregational support (presentation)."
            };
            db.Donations.Add(donation);
            seededDonations.Add(donation);
        }

        await db.SaveChangesAsync();

        foreach (var donation in seededDonations)
        {
            db.DonationAllocations.Add(new DonationAllocation
            {
                DonationId = donation.DonationId,
                SafehouseId = safehouse.SafehouseId,
                ProgramArea = "Residential care",
                AmountAllocated = 3500m,
                AllocationDate = donation.DonationDate,
                AllocationNotes = $"{Marker} Allocated toward safe home operations."
            });
        }

        await db.SaveChangesAsync();
        logger.LogInformation(
            "Presentation seed complete: Maria {CaseNo} (ResidentId {Rid}), congregation {Email}, safehouse {Shid}.",
            MariaCaseControl,
            mariaId,
            CongregationEmail,
            safehouse.SafehouseId);
    }

    private static async Task RemoveMariaSeedRowsAsync(AppDbContext db, int mariaId)
    {
        await db.ProcessRecordings
            .Where(p => p.ResidentId == mariaId && p.FollowUpActions.Contains(Marker))
            .ExecuteDeleteAsync();

        await db.EducationRecords
            .Where(e => e.ResidentId == mariaId && e.Notes != null && e.Notes.Contains(Marker))
            .ExecuteDeleteAsync();

        await db.HealthWellbeingRecords
            .Where(h => h.ResidentId == mariaId && h.MedicalNotesRestricted != null && h.MedicalNotesRestricted.Contains(Marker))
            .ExecuteDeleteAsync();

        await db.HomeVisitations
            .Where(v => v.ResidentId == mariaId && v.FollowUpNotes != null && v.FollowUpNotes.Contains(Marker))
            .ExecuteDeleteAsync();

        await db.MlPredictions
            .Where(m =>
                m.EntityType == "Resident"
                && m.EntityId == mariaId
                && m.FeaturePayloadJson != null
                && m.FeaturePayloadJson.Contains("\"seed\":\"presentation\""))
            .ExecuteDeleteAsync();
    }

    private static async Task RemoveCongregationSeedDonationsAsync(AppDbContext db)
    {
        var supporter = await db.Supporters.AsNoTracking().FirstOrDefaultAsync(s => s.Email == CongregationEmail);
        if (supporter == null) return;

        await db.Donations
            .Where(d => d.SupporterId == supporter.SupporterId && d.Notes != null && d.Notes.Contains(Marker))
            .ExecuteDeleteAsync();
    }
}
