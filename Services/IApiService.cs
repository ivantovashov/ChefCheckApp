using ChefCheckApp.Models;

namespace ChefCheckApp.Services;

public interface IApiService
{
	Task<bool> SendReportAsync(InspectionReport report);
	Task<bool> SendToTelegramAsync(InspectionReport report, string chatId);
	Task<bool> SendToGoogleSheetsAsync(InspectionReport report, string webhookUrl);
}