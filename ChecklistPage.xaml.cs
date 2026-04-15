#nullable disable
using System.Reflection;
using System.Text.Json;
using ChefCheckApp.Services;

namespace ChefCheckApp;

public partial class ChecklistPage : ContentPage
{
    private readonly IDatabaseService _databaseService;
    private readonly IFileService _fileService;

    public ChecklistPage(IDatabaseService databaseService, IFileService fileService)
    {
        InitializeComponent();
        _databaseService = databaseService;
        _fileService = fileService;

        LoadHtml();
    }

    private async void LoadHtml()
    {
        try
        {
            await _databaseService.InitializeAsync();

            var assembly = typeof(ChecklistPage).Assembly;
            var htmlStream = assembly.GetManifestResourceStream("ChefCheckApp.Resources.Raw.index.html");
            var jsStream = assembly.GetManifestResourceStream("ChefCheckApp.Resources.Raw.app.js");

            if (htmlStream != null && jsStream != null)
            {
                using var htmlReader = new StreamReader(htmlStream);
                var htmlContent = await htmlReader.ReadToEndAsync();

                using var jsReader = new StreamReader(jsStream);
                var jsContent = await jsReader.ReadToEndAsync();

                var bridgeScript = @"
                    window.saveToDatabase = function(id, status, note) {
                        var url = 'chefcheck:saveCheck?id=' + id + '&status=' + encodeURIComponent(status || 'null') + '&note=' + encodeURIComponent(note || 'null');
                        window.location.href = url;
                    };
                    
                    window.loadFromDatabase = function() {
                        var url = 'chefcheck:loadChecks';
                        window.location.href = url;
                    };
                    
                    window.saveReportToDatabase = function(inspector, total, passed, failed, percent, details) {
                        var url = 'chefcheck:saveReport?inspector=' + encodeURIComponent(inspector) + '&total=' + total + '&passed=' + passed + '&failed=' + failed + '&percent=' + percent + '&details=' + encodeURIComponent(details);
                        window.location.href = url;
                    };
                    
                    window.exportToPdf = function(html) {
                        var url = 'chefcheck:exportPdf?html=' + encodeURIComponent(html);
                        window.location.href = url;
                    };
                    
                    window.loadHistoryFromDatabase = function() {
                        var url = 'chefcheck:loadHistory';
                        window.location.href = url;
                    };
                    
                    window.showMessage = function(msg) {
                        var url = 'chefcheck:showMessage?msg=' + encodeURIComponent(msg);
                        window.location.href = url;
                    };
                    
                    window.saveCallback = function(id, result) {
                        console.log('Save callback:', result);
                    };
                    
                    window.loadCallback = function(id, data) {
                        if (window.onDataLoaded) {
                            window.onDataLoaded(data);
                        }
                    };
                    
                    window.historyCallback = function(id, data) {
                        if (window.onHistoryLoaded) {
                            window.onHistoryLoaded(data);
                        }
                    };
                    
                    window.exportCallback = function(id, result) {
                        if (result.success) {
                            alert('PDF сохранён: ' + result.path);
                        }
                    };
                ";

                var finalHtml = htmlContent.Replace("</body>", $"<script>{bridgeScript}</script><script>{jsContent}</script></body>");

                MainWebView.Source = new HtmlWebViewSource { Html = finalHtml };
                MainWebView.Navigating += OnWebViewNavigating;
            }
        }
        catch (Exception ex)
        {
            await DisplayAlert("Ошибка", ex.Message, "OK");
        }
    }

    private async void OnWebViewNavigating(object sender, WebNavigatingEventArgs e)
    {
        var url = e.Url;
        if (url.StartsWith("chefcheck:"))
        {
            e.Cancel = true;

            var action = url.Replace("chefcheck:", "");
            var parts = action.Split('?');
            var command = parts[0];

            try
            {
                switch (command)
                {
                    case "saveCheck":
                        if (parts.Length > 1)
                        {
                            var parameters = parts[1].Split('&');
                            var id = int.Parse(parameters[0].Split('=')[1]);
                            var status = Uri.UnescapeDataString(parameters[1].Split('=')[1]);
                            var note = Uri.UnescapeDataString(parameters[2].Split('=')[1]);
                            await _databaseService.SaveCheckAsync(id, status == "null" ? null : status, note == "null" ? null : note);
                            await MainWebView.EvaluateJavaScriptAsync($"window.saveCallback('{Guid.NewGuid()}', {{ success: true }})");
                        }
                        break;

                    case "loadChecks":
                        var checks = await _databaseService.GetTodayChecksAsync();
                        var checksDict = checks.ToDictionary(c => c.Id, c => new { c.Status, c.Note });
                        var json = System.Text.Json.JsonSerializer.Serialize(checksDict);
                        await MainWebView.EvaluateJavaScriptAsync($"window.loadCallback('{Guid.NewGuid()}', {json})");
                        break;

                    case "saveReport":
                        if (parts.Length > 1)
                        {
                            var parameters = parts[1].Split('&');
                            var inspector = Uri.UnescapeDataString(parameters[0].Split('=')[1]);
                            var total = int.Parse(parameters[1].Split('=')[1]);
                            var passed = int.Parse(parameters[2].Split('=')[1]);
                            var failed = int.Parse(parameters[3].Split('=')[1]);
                            var percent = int.Parse(parameters[4].Split('=')[1]);
                            var details = Uri.UnescapeDataString(parameters[5].Split('=')[1]);
                            await _databaseService.SaveInspectionReportAsync(inspector, total, passed, failed, percent, details);
                            await MainWebView.EvaluateJavaScriptAsync($"window.saveCallback('{Guid.NewGuid()}', {{ success: true }})");
                        }
                        break;

                    case "exportPdf":
                        if (parts.Length > 1)
                        {
                            var html = Uri.UnescapeDataString(parts[1].Split('=')[1]);
                            var filePath = await _fileService.SaveHtmlReportAsync(html, "chefcheck_report");
                            await _fileService.ShareFileAsync(filePath, "ChefCheck Report");
                            await MainWebView.EvaluateJavaScriptAsync($"window.exportCallback('{Guid.NewGuid()}', {{ success: true, path: '{filePath}' }})");
                        }
                        break;

                    case "loadHistory":
                        var history = await _databaseService.GetReportsAsync(50);
                        var historyJson = System.Text.Json.JsonSerializer.Serialize(history);
                        await MainWebView.EvaluateJavaScriptAsync($"window.historyCallback('{Guid.NewGuid()}', {historyJson})");
                        break;

                    case "showMessage":
                        if (parts.Length > 1)
                        {
                            var msg = Uri.UnescapeDataString(parts[1].Split('=')[1]);
                            await MainThread.InvokeOnMainThreadAsync(async () =>
                            {
                                await DisplayAlert("Уведомление", msg, "OK");
                            });
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error: {ex.Message}");
                await MainWebView.EvaluateJavaScriptAsync($"window.saveCallback('{Guid.NewGuid()}', {{ success: false, error: '{ex.Message}' }})");
            }
        }
    }
}