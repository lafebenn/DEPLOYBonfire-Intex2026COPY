using Bonfire.API.Data;
using Bonfire.API.Infrastructure;
using Bonfire.API.Models;
using Bonfire.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Staff")]
[Route("api/residents")]
public class ResidentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SanitizerService _s;
    private readonly ILogger<ResidentsController> _logger;

    public ResidentsController(AppDbContext db, SanitizerService s, ILogger<ResidentsController> logger)
    {
        _db = db;
        _s = s;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> List(
        [FromQuery] int? safehouseId,
        [FromQuery] string? caseStatus,
        [FromQuery] string? riskLevel,
        [FromQuery] string? caseCategory,
        [FromQuery] string? search)
    {
        var q = _db.Residents.AsNoTracking().AsQueryable();
        if (safehouseId.HasValue) q = q.Where(r => r.SafehouseId == safehouseId.Value);
        if (!string.IsNullOrWhiteSpace(caseStatus)) q = q.Where(r => r.CaseStatus == caseStatus);
        if (!string.IsNullOrWhiteSpace(riskLevel)) q = q.Where(r => r.CurrentRiskLevel == riskLevel);
        if (!string.IsNullOrWhiteSpace(caseCategory)) q = q.Where(r => r.CaseCategory == caseCategory);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var t = search.Trim();
            q = q.Where(r => r.CaseControlNo.Contains(t) || r.InternalCode.Contains(t));
        }

        var list = await q.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Get(int id)
    {
        var r = await _db.Residents.AsNoTracking().FirstOrDefaultAsync(x => x.ResidentId == id);
        if (r == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(r));
    }

    public class ResidentWriteDto
    {
        public string CaseControlNo { get; set; } = string.Empty;
        public string InternalCode { get; set; } = string.Empty;
        public int SafehouseId { get; set; }
        public string CaseStatus { get; set; } = string.Empty;
        public string? Sex { get; set; }
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
        public string? NotesRestricted { get; set; }
    }

    private static void MapResident(Resident r, ResidentWriteDto d, SanitizerService s)
    {
        r.CaseControlNo = s.Sanitize(d.CaseControlNo) ?? "";
        r.InternalCode = s.Sanitize(d.InternalCode) ?? "";
        r.SafehouseId = d.SafehouseId;
        r.CaseStatus = s.Sanitize(d.CaseStatus) ?? "";
        r.Sex = s.Sanitize(d.Sex) ?? "F";
        r.DateOfBirth = d.DateOfBirth;
        r.BirthStatus = s.Sanitize(d.BirthStatus) ?? "";
        r.PlaceOfBirth = s.Sanitize(d.PlaceOfBirth) ?? "";
        r.Religion = s.Sanitize(d.Religion) ?? "";
        r.CaseCategory = s.Sanitize(d.CaseCategory) ?? "";
        r.SubCatOrphaned = d.SubCatOrphaned;
        r.SubCatTrafficked = d.SubCatTrafficked;
        r.SubCatChildLabor = d.SubCatChildLabor;
        r.SubCatPhysicalAbuse = d.SubCatPhysicalAbuse;
        r.SubCatSexualAbuse = d.SubCatSexualAbuse;
        r.SubCatOsaec = d.SubCatOsaec;
        r.SubCatCicl = d.SubCatCicl;
        r.SubCatAtRisk = d.SubCatAtRisk;
        r.SubCatStreetChild = d.SubCatStreetChild;
        r.SubCatChildWithHiv = d.SubCatChildWithHiv;
        r.IsPwd = d.IsPwd;
        r.PwdType = s.Sanitize(d.PwdType);
        r.HasSpecialNeeds = d.HasSpecialNeeds;
        r.SpecialNeedsDiagnosis = s.Sanitize(d.SpecialNeedsDiagnosis);
        r.FamilyIs4ps = d.FamilyIs4ps;
        r.FamilySoloParent = d.FamilySoloParent;
        r.FamilyIndigenous = d.FamilyIndigenous;
        r.FamilyParentPwd = d.FamilyParentPwd;
        r.FamilyInformalSettler = d.FamilyInformalSettler;
        r.DateOfAdmission = d.DateOfAdmission;
        r.ReferralSource = s.Sanitize(d.ReferralSource) ?? "";
        r.ReferringAgencyPerson = s.Sanitize(d.ReferringAgencyPerson) ?? "";
        r.AssignedSocialWorker = s.Sanitize(d.AssignedSocialWorker) ?? "";
        r.InitialCaseAssessment = s.Sanitize(d.InitialCaseAssessment) ?? "";
        r.ReintegrationType = s.Sanitize(d.ReintegrationType);
        r.ReintegrationStatus = s.Sanitize(d.ReintegrationStatus);
        r.InitialRiskLevel = s.Sanitize(d.InitialRiskLevel) ?? "";
        r.CurrentRiskLevel = s.Sanitize(d.CurrentRiskLevel) ?? "";
        r.DateEnrolled = d.DateEnrolled;
        r.DateClosed = d.DateClosed;
        r.NotesRestricted = s.Sanitize(d.NotesRestricted);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] ResidentWriteDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Validation failed"));
        if (!await _db.Safehouses.AnyAsync(sh => sh.SafehouseId == dto.SafehouseId))
            return BadRequest(ApiResponse<object>.Fail("Invalid safehouse."));

        var r = new Resident { CreatedAt = DateTime.UtcNow };
        MapResident(r, dto, _s);
        _db.Residents.Add(r);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Resident {Id} created", r.ResidentId);
        return StatusCode(201, ApiResponse<object>.Ok(new { id = r.ResidentId }));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] ResidentWriteDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Validation failed"));
        var r = await _db.Residents.FindAsync(id);
        if (r == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        if (!await _db.Safehouses.AnyAsync(sh => sh.SafehouseId == dto.SafehouseId))
            return BadRequest(ApiResponse<object>.Fail("Invalid safehouse."));
        MapResident(r, dto, _s);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Updated"));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        if (!DeleteConfirmation.IsConfirmed(Request.Query))
            return BadRequest(ApiResponse<object>.Fail(DeleteConfirmation.Message));
        var r = await _db.Residents.FindAsync(id);
        if (r == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        _db.Residents.Remove(r);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Deleted"));
    }

    // --- Nested: process recordings ---
    [HttpGet("{id:int}/process-recordings")]
    public async Task<ActionResult<ApiResponse<object>>> ListRecordings(int id)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var list = await _db.ProcessRecordings.AsNoTracking().Where(p => p.ResidentId == id).OrderByDescending(p => p.SessionDate).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    public class ProcessRecordingDto
    {
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

    [HttpPost("{id:int}/process-recordings")]
    public async Task<ActionResult<ApiResponse<object>>> AddRecording(int id, [FromBody] ProcessRecordingDto dto)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var e = new ProcessRecording
        {
            ResidentId = id,
            SessionDate = dto.SessionDate,
            SocialWorker = _s.Sanitize(dto.SocialWorker) ?? "",
            SessionType = _s.Sanitize(dto.SessionType) ?? "",
            SessionDurationMinutes = dto.SessionDurationMinutes,
            EmotionalStateObserved = _s.Sanitize(dto.EmotionalStateObserved) ?? "",
            EmotionalStateEnd = _s.Sanitize(dto.EmotionalStateEnd) ?? "",
            SessionNarrative = _s.Sanitize(dto.SessionNarrative) ?? "",
            InterventionsApplied = _s.Sanitize(dto.InterventionsApplied) ?? "",
            FollowUpActions = _s.Sanitize(dto.FollowUpActions) ?? "",
            ProgressNoted = dto.ProgressNoted,
            ConcernsFlagged = dto.ConcernsFlagged,
            ReferralMade = dto.ReferralMade,
            NotesRestricted = _s.Sanitize(dto.NotesRestricted)
        };
        _db.ProcessRecordings.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.RecordingId }));
    }

    [HttpGet("{id:int}/home-visitations")]
    public async Task<ActionResult<ApiResponse<object>>> ListVisits(int id)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var list = await _db.HomeVisitations.AsNoTracking().Where(v => v.ResidentId == id).OrderByDescending(v => v.VisitDate).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    public class HomeVisitDto
    {
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

    [HttpPost("{id:int}/home-visitations")]
    public async Task<ActionResult<ApiResponse<object>>> AddVisit(int id, [FromBody] HomeVisitDto dto)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var e = new HomeVisitation
        {
            ResidentId = id,
            VisitDate = dto.VisitDate,
            SocialWorker = _s.Sanitize(dto.SocialWorker) ?? "",
            VisitType = _s.Sanitize(dto.VisitType) ?? "",
            LocationVisited = _s.Sanitize(dto.LocationVisited) ?? "",
            FamilyMembersPresent = _s.Sanitize(dto.FamilyMembersPresent) ?? "",
            Purpose = _s.Sanitize(dto.Purpose) ?? "",
            Observations = _s.Sanitize(dto.Observations) ?? "",
            FamilyCooperationLevel = _s.Sanitize(dto.FamilyCooperationLevel) ?? "",
            SafetyConcernsNoted = dto.SafetyConcernsNoted,
            FollowUpNeeded = dto.FollowUpNeeded,
            FollowUpNotes = _s.Sanitize(dto.FollowUpNotes),
            VisitOutcome = _s.Sanitize(dto.VisitOutcome) ?? ""
        };
        _db.HomeVisitations.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.VisitationId }));
    }

    [HttpGet("{id:int}/education-records")]
    public async Task<ActionResult<ApiResponse<object>>> ListEdu(int id)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var list = await _db.EducationRecords.AsNoTracking().Where(e => e.ResidentId == id).OrderByDescending(e => e.RecordDate).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    public class EducationDto
    {
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

    [HttpPost("{id:int}/education-records")]
    public async Task<ActionResult<ApiResponse<object>>> AddEdu(int id, [FromBody] EducationDto dto)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var e = new EducationRecord
        {
            ResidentId = id,
            RecordDate = dto.RecordDate,
            ProgramName = _s.Sanitize(dto.ProgramName) ?? "",
            CourseName = _s.Sanitize(dto.CourseName) ?? "",
            EducationLevel = _s.Sanitize(dto.EducationLevel) ?? "",
            AttendanceStatus = _s.Sanitize(dto.AttendanceStatus) ?? "",
            AttendanceRate = dto.AttendanceRate,
            ProgressPercent = dto.ProgressPercent,
            CompletionStatus = _s.Sanitize(dto.CompletionStatus) ?? "",
            GpaLikeScore = dto.GpaLikeScore,
            Notes = _s.Sanitize(dto.Notes)
        };
        _db.EducationRecords.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.EducationRecordId }));
    }

    [HttpGet("{id:int}/health-records")]
    public async Task<ActionResult<ApiResponse<object>>> ListHealth(int id)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var list = await _db.HealthWellbeingRecords.AsNoTracking().Where(h => h.ResidentId == id).OrderByDescending(h => h.RecordDate).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    public class HealthDto
    {
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

    [HttpPost("{id:int}/health-records")]
    public async Task<ActionResult<ApiResponse<object>>> AddHealth(int id, [FromBody] HealthDto dto)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var e = new HealthWellbeingRecord
        {
            ResidentId = id,
            RecordDate = dto.RecordDate,
            WeightKg = dto.WeightKg,
            HeightCm = dto.HeightCm,
            Bmi = dto.Bmi,
            NutritionScore = dto.NutritionScore,
            SleepScore = dto.SleepScore,
            EnergyScore = dto.EnergyScore,
            GeneralHealthScore = dto.GeneralHealthScore,
            MedicalCheckupDone = dto.MedicalCheckupDone,
            DentalCheckupDone = dto.DentalCheckupDone,
            PsychologicalCheckupDone = dto.PsychologicalCheckupDone,
            MedicalNotesRestricted = _s.Sanitize(dto.MedicalNotesRestricted)
        };
        _db.HealthWellbeingRecords.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.HealthRecordId }));
    }

    [HttpGet("{id:int}/intervention-plans")]
    public async Task<ActionResult<ApiResponse<object>>> ListPlans(int id)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var list = await _db.InterventionPlans.AsNoTracking().Where(p => p.ResidentId == id).OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    public class InterventionPlanDto
    {
        public string PlanCategory { get; set; } = string.Empty;
        public string PlanDescription { get; set; } = string.Empty;
        public string ServicesProvided { get; set; } = string.Empty;
        public decimal? TargetValue { get; set; }
        public DateOnly TargetDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateOnly? CaseConferenceDate { get; set; }
    }

    [HttpPost("{id:int}/intervention-plans")]
    public async Task<ActionResult<ApiResponse<object>>> AddPlan(int id, [FromBody] InterventionPlanDto dto)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var now = DateTime.UtcNow;
        var e = new InterventionPlan
        {
            ResidentId = id,
            PlanCategory = _s.Sanitize(dto.PlanCategory) ?? "",
            PlanDescription = _s.Sanitize(dto.PlanDescription) ?? "",
            ServicesProvided = _s.Sanitize(dto.ServicesProvided) ?? "",
            TargetValue = dto.TargetValue,
            TargetDate = dto.TargetDate,
            Status = _s.Sanitize(dto.Status) ?? "",
            CaseConferenceDate = dto.CaseConferenceDate,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.InterventionPlans.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.PlanId }));
    }

    [HttpGet("{id:int}/incidents")]
    public async Task<ActionResult<ApiResponse<object>>> ListIncidents(int id)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        var list = await _db.IncidentReports.AsNoTracking().Where(i => i.ResidentId == id).OrderByDescending(i => i.IncidentDate).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    public class IncidentDto
    {
        public int SafehouseId { get; set; }
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

    [HttpPost("{id:int}/incidents")]
    public async Task<ActionResult<ApiResponse<object>>> AddIncident(int id, [FromBody] IncidentDto dto)
    {
        if (!await _db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound(ApiResponse<object>.Fail("Not found"));
        if (!await _db.Safehouses.AnyAsync(s => s.SafehouseId == dto.SafehouseId))
            return BadRequest(ApiResponse<object>.Fail("Invalid safehouse."));
        var e = new IncidentReport
        {
            ResidentId = id,
            SafehouseId = dto.SafehouseId,
            IncidentDate = dto.IncidentDate,
            IncidentType = _s.Sanitize(dto.IncidentType) ?? "",
            Severity = _s.Sanitize(dto.Severity) ?? "",
            Description = _s.Sanitize(dto.Description) ?? "",
            ResponseTaken = _s.Sanitize(dto.ResponseTaken) ?? "",
            Resolved = dto.Resolved,
            ResolutionDate = dto.ResolutionDate,
            ReportedBy = _s.Sanitize(dto.ReportedBy) ?? "",
            FollowUpRequired = dto.FollowUpRequired
        };
        _db.IncidentReports.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.IncidentId }));
    }
}
