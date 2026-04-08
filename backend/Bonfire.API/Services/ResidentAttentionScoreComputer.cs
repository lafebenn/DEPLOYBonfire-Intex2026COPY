using Bonfire.API.Models;

namespace Bonfire.API.Services;

/// <summary>
/// Prototype composite "needs attention" score from resident records + latest ML resident-risk prediction.
/// Subscores are 0–1; composite is 0–100 after weighting.
/// </summary>
public static class ResidentAttentionScoreComputer
{
    public sealed class ActiveResidentRow
    {
        public int ResidentId { get; init; }
        public string CaseControlNo { get; init; } = "";
        public string InternalCode { get; init; } = "";
        public string CurrentRiskLevel { get; init; } = "";
        public string SafehouseName { get; init; } = "";
    }

    public sealed class AttentionResult
    {
        public int ResidentId { get; init; }
        public string DisplayName { get; init; } = "";
        public string CaseControlNo { get; init; } = "";
        public string InternalCode { get; init; } = "";
        public string SafehouseName { get; init; } = "";
        public string CurrentRiskLevel { get; init; } = "";
        public decimal CompositeScore { get; init; }
        public int FlameLevel { get; init; }
        public Dictionary<string, decimal> Factors { get; init; } = new();
    }

    private static decimal Clamp01(decimal x) => x < 0 ? 0 : (x > 1 ? 1 : x);

    /// <summary>Maps free-text emotional notes to risk (higher = more concerning).</summary>
    public static decimal EmotionalTextRisk(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0.45m;
        var t = text.ToLowerInvariant();
        string[] negative =
        [
            "distress", "anxious", "anxiety", "angry", "aggress", "withdraw", "depress", "depression",
            "sad", "crisis", "violent", "harm", "low mood", "meltdown", "unstable", "fear", "panic",
            "hopeless", "suicid", "self-harm", "mute", "shutdown"
        ];
        string[] positive =
        [
            "calm", "stable", "happy", "positive", "cooperative", "improved", "hopeful", "engaged",
            "resilient", "coping", "cheerful"
        ];
        var n = negative.Count(t.Contains);
        var p = positive.Count(t.Contains);
        if (n > p) return Clamp01(0.55m + 0.12m * n);
        if (p > n) return Clamp01(0.38m - 0.08m * p);
        return 0.5m;
    }

    private static decimal SessionEmotionalRisk(string? start, string? end) =>
        (EmotionalTextRisk(start) + EmotionalTextRisk(end)) / 2m;

    private static decimal ManualRiskLevelBump(string? level)
    {
        if (string.IsNullOrWhiteSpace(level)) return 0;
        var l = level.Trim().ToLowerInvariant();
        if (l.Contains("critical")) return 1m;
        if (l.Contains("high")) return 0.75m;
        if (l.Contains("medium")) return 0.45m;
        if (l.Contains("low")) return 0.15m;
        return 0.35m;
    }

    public static List<AttentionResult> ComputeForActiveResidents(
        DateOnly today,
        IReadOnlyList<ActiveResidentRow> activeResidents,
        IReadOnlyList<ProcessRecording> processRecordings,
        IReadOnlyList<EducationRecord> educationRecords,
        IReadOnlyList<HealthWellbeingRecord> healthRecords,
        IReadOnlyDictionary<int, int> incidentCount30d,
        IReadOnlyDictionary<int, decimal> latestMlResidentRisk)
    {
        var ids = activeResidents.Select(r => r.ResidentId).ToHashSet();
        var byProc = processRecordings
            .Where(p => ids.Contains(p.ResidentId))
            .GroupBy(p => p.ResidentId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.SessionDate).ToList());
        var byEdu = educationRecords
            .Where(e => ids.Contains(e.ResidentId))
            .GroupBy(e => e.ResidentId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.RecordDate).ToList());
        var byHealth = healthRecords
            .Where(h => ids.Contains(h.ResidentId))
            .GroupBy(h => h.ResidentId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.RecordDate).ToList());

        const decimal wRecording = 0.18m;
        const decimal wEmotional = 0.12m;
        const decimal wIncident = 0.18m;
        const decimal wEducation = 0.12m;
        const decimal wHealth = 0.12m;
        const decimal wMl = 0.20m;
        const decimal wManual = 0.08m;

        var results = new List<AttentionResult>();

        foreach (var res in activeResidents)
        {
            var rid = res.ResidentId;
            byProc.TryGetValue(rid, out var procs);
            procs ??= new List<ProcessRecording>();

            DateOnly? lastSession = procs.Count > 0 ? procs[0].SessionDate : null;
            int daysSince = lastSession == null
                ? 999
                : today.DayNumber - lastSession.Value.DayNumber;
            var recordingOverdue = lastSession == null
                ? 1m
                : Clamp01((daysSince - 7m) / 21m);

            decimal emotionalTrend = 0;
            var lastThree = procs.Take(3).OrderBy(x => x.SessionDate).ToList();
            if (lastThree.Count >= 2)
            {
                var first = SessionEmotionalRisk(lastThree[0].EmotionalStateObserved, lastThree[0].EmotionalStateEnd);
                var last = SessionEmotionalRisk(lastThree[^1].EmotionalStateObserved, lastThree[^1].EmotionalStateEnd);
                emotionalTrend = Clamp01((last - first) * 1.25m);
                if (lastThree[^1].ConcernsFlagged) emotionalTrend = Clamp01(emotionalTrend + 0.15m);
            }
            else if (procs.Any(p => p.ConcernsFlagged))
                emotionalTrend = 0.35m;

            incidentCount30d.TryGetValue(rid, out var incN);
            var incidentLoad = Clamp01(incN / 3m);

            decimal educationDrop = 0;
            if (byEdu.TryGetValue(rid, out var eduList) && eduList.Count >= 3)
            {
                var recent = eduList.Take(2).Average(x => x.AttendanceRate);
                var priorSlice = eduList.Skip(2).Take(2).ToList();
                var prior = priorSlice.Count > 0 ? priorSlice.Average(x => x.AttendanceRate) : recent;
                if (prior - recent > 5m) educationDrop = Clamp01((prior - recent) / 25m);
            }

            decimal healthDecline = 0;
            if (byHealth.TryGetValue(rid, out var hList) && hList.Count >= 2)
            {
                var newest = hList[0].GeneralHealthScore;
                var older = hList[1].GeneralHealthScore;
                if (older - newest > 3m) healthDecline = Clamp01((older - newest) / 15m);
            }

            latestMlResidentRisk.TryGetValue(rid, out var ml);
            var mlScore = Clamp01(ml);

            var manual = ManualRiskLevelBump(res.CurrentRiskLevel);

            var composite = 100m * (
                wRecording * recordingOverdue +
                wEmotional * emotionalTrend +
                wIncident * incidentLoad +
                wEducation * educationDrop +
                wHealth * healthDecline +
                wMl * mlScore +
                wManual * manual
            );

            var flame = composite >= 70 ? 3 : composite >= 45 ? 2 : composite >= 22 ? 1 : 0;

            var display = !string.IsNullOrWhiteSpace(res.InternalCode)
                ? res.InternalCode.Trim()
                : !string.IsNullOrWhiteSpace(res.CaseControlNo)
                    ? res.CaseControlNo.Trim()
                    : $"Resident #{rid}";

            results.Add(new AttentionResult
            {
                ResidentId = rid,
                DisplayName = display,
                CaseControlNo = res.CaseControlNo,
                InternalCode = res.InternalCode,
                SafehouseName = res.SafehouseName,
                CurrentRiskLevel = res.CurrentRiskLevel,
                CompositeScore = Math.Round(composite, 1),
                FlameLevel = flame,
                Factors = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
                {
                    ["recordingOverdue"] = Math.Round(100m * recordingOverdue, 0),
                    ["emotionalTrend"] = Math.Round(100m * emotionalTrend, 0),
                    ["incidents30d"] = Math.Round(100m * incidentLoad, 0),
                    ["educationAttendanceDrop"] = Math.Round(100m * educationDrop, 0),
                    ["healthDecline"] = Math.Round(100m * healthDecline, 0),
                    ["mlResidentRisk"] = Math.Round(100m * mlScore, 0),
                    ["caseRiskLevel"] = Math.Round(100m * manual, 0),
                }
            });
        }

        return results
            .OrderByDescending(r => r.CompositeScore)
            .ThenBy(r => r.DisplayName)
            .ToList();
    }
}
