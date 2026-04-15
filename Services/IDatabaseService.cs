using ChefCheckApp.Models;

namespace ChefCheckApp.Services;

public interface IDatabaseService
{
    Task InitializeAsync();
    Task<List<CheckItem>> GetTodayChecksAsync();
    Task SaveCheckAsync(int id, string? status, string? note);
    Task<int> SaveInspectionReportAsync(string inspector, int total, int passed, int failed, int percent, string detailsJson);
    Task<List<InspectionReport>> GetReportsAsync(int limit = 50);
    Task ClearTodayDataAsync();
}