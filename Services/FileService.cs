namespace ChefCheckApp.Services;

public class FileService : IFileService
{
    public async Task<string> SaveHtmlReportAsync(string htmlContent, string fileName)
    {
        var filePath = Path.Combine(FileSystem.CacheDirectory, $"{fileName}_{DateTime.Now:yyyyMMdd_HHmmss}.html");
        await File.WriteAllTextAsync(filePath, htmlContent);
        return filePath;
    }

    public async Task<bool> ShareFileAsync(string filePath, string title)
    {
        try
        {
            await Share.Default.RequestAsync(new ShareFileRequest(title, new ShareFile(filePath)));
            return true;
        }
        catch
        {
            return false;
        }
    }
}