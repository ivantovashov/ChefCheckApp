namespace ChefCheckApp.Services;

public interface IFileService
{
    Task<string> SaveHtmlReportAsync(string htmlContent, string fileName);
    Task<bool> ShareFileAsync(string filePath, string title);
}