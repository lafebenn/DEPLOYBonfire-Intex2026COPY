using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Bonfire.API.Models;

public class Resident
{
    public int ResidentId { get; set; }

    [Required, MaxLength(20)]
    public string CaseControlNo { get; set; } = string.Empty;

    public string InternalCode { get; set; } = string.Empty;

    public int SafehouseId { get; set; }

    [ForeignKey(nameof(SafehouseId))]
    public Safehouse Safehouse { get; set; } = null!;

    public string CaseStatus { get; set; } = string.Empty;
    public string Sex { get; set; } = "F";
    public DateOnly DateOfBirth { get; set; }
    public string BirthStatus { get; set; } = string.Empty;
    public string PlaceOfBirth { get; set; } = string.Empty;
    public string Religion { get; set; } = string.Empty;
    public string CaseCategory { get; set; } = string.Empty;
    public bool SubCatOrphaned { get; set; }
    public bool SubCatTrafficked { get; set; }
    public bool SubCatChildLabor { get; set; }
    public bool SubCatPhysicalAbuse { get; set; }
    public bool SubCatSexualAbuse { get; set; }
    public bool SubCatOsaec { get; set; }
    public bool SubCatCicl { get; set; }
    public bool SubCatAtRisk { get; set; }
    public bool SubCatStreetChild { get; set; }
    public bool SubCatChildWithHiv { get; set; }
    public bool IsPwd { get; set; }
    public string? PwdType { get; set; }
    public bool HasSpecialNeeds { get; set; }
    public string? SpecialNeedsDiagnosis { get; set; }
    public bool FamilyIs4ps { get; set; }
    public bool FamilySoloParent { get; set; }
    public bool FamilyIndigenous { get; set; }
    public bool FamilyParentPwd { get; set; }
    public bool FamilyInformalSettler { get; set; }
    public DateOnly DateOfAdmission { get; set; }
    public string ReferralSource { get; set; } = string.Empty;
    public string ReferringAgencyPerson { get; set; } = string.Empty;
    public string AssignedSocialWorker { get; set; } = string.Empty;
    public string InitialCaseAssessment { get; set; } = string.Empty;
    public string? ReintegrationType { get; set; }
    public string? ReintegrationStatus { get; set; }
    public string InitialRiskLevel { get; set; } = string.Empty;
    public string CurrentRiskLevel { get; set; } = string.Empty;
    public DateOnly DateEnrolled { get; set; }
    public DateOnly? DateClosed { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? NotesRestricted { get; set; }

    public ICollection<ProcessRecording> ProcessRecordings { get; set; } = new List<ProcessRecording>();
    public ICollection<HomeVisitation> HomeVisitations { get; set; } = new List<HomeVisitation>();
    public ICollection<EducationRecord> EducationRecords { get; set; } = new List<EducationRecord>();
    public ICollection<HealthWellbeingRecord> HealthRecords { get; set; } = new List<HealthWellbeingRecord>();
    public ICollection<InterventionPlan> InterventionPlans { get; set; } = new List<InterventionPlan>();
    public ICollection<IncidentReport> IncidentReports { get; set; } = new List<IncidentReport>();
}

public class ProcessRecording
{
    [Key]
    public int RecordingId { get; set; }

    public int ResidentId { get; set; }

    [ForeignKey(nameof(ResidentId))]
    public Resident Resident { get; set; } = null!;

    public DateOnly SessionDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string SessionType { get; set; } = string.Empty;
    public int SessionDurationMinutes { get; set; }
    public string EmotionalStateObserved { get; set; } = string.Empty;
    public string EmotionalStateEnd { get; set; } = string.Empty;
    public string SessionNarrative { get; set; } = string.Empty;
    public string InterventionsApplied { get; set; } = string.Empty;
    public string FollowUpActions { get; set; } = string.Empty;
    public bool ProgressNoted { get; set; }
    public bool ConcernsFlagged { get; set; }
    public bool ReferralMade { get; set; }
    public string? NotesRestricted { get; set; }
}

public class HomeVisitation
{
    [Key]
    public int VisitationId { get; set; }

    public int ResidentId { get; set; }

    [ForeignKey(nameof(ResidentId))]
    public Resident Resident { get; set; } = null!;

    public DateOnly VisitDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string LocationVisited { get; set; } = string.Empty;
    public string FamilyMembersPresent { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string Observations { get; set; } = string.Empty;
    public string FamilyCooperationLevel { get; set; } = string.Empty;
    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string VisitOutcome { get; set; } = string.Empty;
}

public class EducationRecord
{
    [Key]
    public int EducationRecordId { get; set; }

    public int ResidentId { get; set; }

    [ForeignKey(nameof(ResidentId))]
    public Resident Resident { get; set; } = null!;

    public DateOnly RecordDate { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string EducationLevel { get; set; } = string.Empty;
    public string AttendanceStatus { get; set; } = string.Empty;
    public decimal AttendanceRate { get; set; }
    public decimal ProgressPercent { get; set; }
    public string CompletionStatus { get; set; } = string.Empty;
    public decimal GpaLikeScore { get; set; }
    public string? Notes { get; set; }
}

public class HealthWellbeingRecord
{
    [Key]
    public int HealthRecordId { get; set; }

    public int ResidentId { get; set; }

    [ForeignKey(nameof(ResidentId))]
    public Resident Resident { get; set; } = null!;

    public DateOnly RecordDate { get; set; }
    public decimal WeightKg { get; set; }
    public decimal HeightCm { get; set; }
    public decimal Bmi { get; set; }
    public decimal NutritionScore { get; set; }
    public decimal SleepScore { get; set; }
    public decimal EnergyScore { get; set; }
    public decimal GeneralHealthScore { get; set; }
    public bool MedicalCheckupDone { get; set; }
    public bool DentalCheckupDone { get; set; }
    public bool PsychologicalCheckupDone { get; set; }
    public string? MedicalNotesRestricted { get; set; }
}

public class InterventionPlan
{
    [Key]
    public int PlanId { get; set; }

    public int ResidentId { get; set; }

    [ForeignKey(nameof(ResidentId))]
    public Resident Resident { get; set; } = null!;

    public string PlanCategory { get; set; } = string.Empty;
    public string PlanDescription { get; set; } = string.Empty;
    public string ServicesProvided { get; set; } = string.Empty;
    public decimal? TargetValue { get; set; }
    public DateOnly TargetDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateOnly? CaseConferenceDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class IncidentReport
{
    [Key]
    public int IncidentId { get; set; }

    public int ResidentId { get; set; }

    [ForeignKey(nameof(ResidentId))]
    public Resident Resident { get; set; } = null!;

    public int SafehouseId { get; set; }

    [ForeignKey(nameof(SafehouseId))]
    public Safehouse Safehouse { get; set; } = null!;

    public DateOnly IncidentDate { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ResponseTaken { get; set; } = string.Empty;
    public bool Resolved { get; set; }
    public DateOnly? ResolutionDate { get; set; }
    public string ReportedBy { get; set; } = string.Empty;
    public bool FollowUpRequired { get; set; }
}
