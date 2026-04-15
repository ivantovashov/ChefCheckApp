using System.Text;
using System.Text.Json;
using ChefCheckApp.Models;

namespace ChefCheckApp.Services;

public class ApiService : IApiService
{
    private readonly HttpClient _httpClient;

    public ApiService()
    {
        _httpClient = new HttpClient();
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<bool> SendReportAsync(InspectionReport report)
    {
        try
        {
            var json = JsonSerializer.Serialize(report);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Ваш эндпоинт API
            var response = await _httpClient.PostAsync("https://your-api.com/reports", content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> SendToTelegramAsync(InspectionReport report, string chatId)
    {
        try
        {
            var botToken = "YOUR_BOT_TOKEN"; // Лучше хранить в secure storage
            var message = FormatTelegramMessage(report);

            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
            var payload = new { chat_id = chatId, text = message, parse_mode = "Markdown" };
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> SendToGoogleSheetsAsync(InspectionReport report, string webhookUrl)
    {
        try
        {
            var json = JsonSerializer.Serialize(report);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(webhookUrl, content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private string FormatTelegramMessage(InspectionReport report)
    {
        var details = JsonSerializer.Deserialize<List<dynamic>>(report.DetailsJson) ?? new();
        var violations = details.Where(d => d.GetProperty("status").GetString() == "-").ToList();

        var message = $"🍽 *ЧЕК-ЛИСТ КУХНИ*\n";
        message += $"📅 {report.Date}\n";
        message += $"👤 {report.Inspector}\n";
        message += $"✅ Выполнено: {report.Passed}/{report.TotalItems} ({report.Percent}%)\n";
        message += $"❌ Нарушений: {report.Failed}\n";

        if (violations.Any())
        {
            message += $"\n⚠️ *Нарушения:*\n";
            foreach (var v in violations.Take(10))
            {
                message += $"• {v.GetProperty("text").GetString()}\n";
            }
        }

        return message;
    }
}
