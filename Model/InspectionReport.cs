using SQLite;

namespace ChefCheckApp.Models;

[Table("InspectionReports")]
public class InspectionReport
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    public string Date { get; set; } = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    public string Inspector { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int Passed { get; set; }
    public int Failed { get; set; }
    public int Percent { get; set; }
    public string DetailsJson { get; set; } = "[]";
}