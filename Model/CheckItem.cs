using SQLite;

namespace ChefCheckApp.Models;

[Table("CheckItems")]
public class CheckItem
{
    [PrimaryKey]
    public int Id { get; set; }

    public string Section { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string? Status { get; set; }
    public string? Note { get; set; }
    public string Date { get; set; } = DateTime.Now.ToString("yyyy-MM-dd");
}