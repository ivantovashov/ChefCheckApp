using SQLite;
using ChefCheckApp.Models;

namespace ChefCheckApp.Services;

public class DatabaseService : IDatabaseService
{
    private SQLiteAsyncConnection? _database;
    private readonly string _dbPath;

    public DatabaseService()
    {
        _dbPath = Path.Combine(FileSystem.AppDataDirectory, "chefcheck.db3");
    }

    public async Task InitializeAsync()
    {
        if (_database != null) return;

        _database = new SQLiteAsyncConnection(_dbPath);
        await _database.CreateTableAsync<CheckItem>();
        await _database.CreateTableAsync<InspectionReport>();
        await SeedInitialDataAsync();
    }

    private async Task SeedInitialDataAsync()
    {
        if (_database == null) return;

        var existing = await _database.Table<CheckItem>().FirstOrDefaultAsync();
        if (existing != null) return;

        var today = DateTime.Now.ToString("yyyy-MM-dd");
        var initialItems = GetInitialChecklistData();

        foreach (var item in initialItems)
        {
            item.Date = today;
            await _database.InsertAsync(item);
        }
    }

    private List<CheckItem> GetInitialChecklistData()
    {
        return new List<CheckItem>
        {
            new() { Id = 1, Section = "📌 ОБЩЕЕ СОСТОЯНИЕ", Text = "Станция чистая (холодильники, полки, ножки холодильников, стены)" },
            new() { Id = 2, Section = "📌 ОБЩЕЕ СОСТОЯНИЕ", Text = "Отсутствие повреждений рабочего оборудования" },
            new() { Id = 3, Section = "📌 ОБЩЕЕ СОСТОЯНИЕ", Text = "Инвентарь промаркирован по цветовой/буквенной кодировке" },
            new() { Id = 4, Section = "📌 ОБЩЕЕ СОСТОЯНИЕ", Text = "Наличие термометра и ведение температурного журнала" },
            new() { Id = 5, Section = "📌 ОБЩЕЕ СОСТОЯНИЕ", Text = "В холодильниках отсутствует наледь" },
            new() { Id = 6, Section = "📌 ОБЩЕЕ СОСТОЯНИЕ", Text = "Мусорка чистая, промаркирована по цеху" },
            new() { Id = 7, Section = "🧑‍🍳 ГИГИЕНА", Text = "Униформа чистая, волосы убраны, нет украшений, ногти подстрижены" },
            new() { Id = 8, Section = "🧑‍🍳 ГИГИЕНА", Text = "Используются перчатки при работе с готовым продуктом" },
            new() { Id = 9, Section = "📦 ХРАНЕНИЕ", Text = "Отсутствие посторонних вещей на рабочем месте" },
            new() { Id = 10, Section = "📦 ХРАНЕНИЕ", Text = "Отсутствует продукция с истекшим сроком годности" },
            new() { Id = 11, Section = "📦 ХРАНЕНИЕ", Text = "Нет незакрытых продуктов/полуфабрикатов в холодильниках" },
            new() { Id = 12, Section = "📦 ХРАНЕНИЕ", Text = "Маркировка в формате (дата/время начала и конца срока)" },
            new() { Id = 13, Section = "📦 ХРАНЕНИЕ", Text = "Отсутствие двойных маркировок" },
            new() { Id = 14, Section = "📦 ХРАНЕНИЕ", Text = "Сохранена заводская этикетка" },
            new() { Id = 15, Section = "📦 ХРАНЕНИЕ", Text = "Продукция не хранится на полу" },
            new() { Id = 16, Section = "📦 ХРАНЕНИЕ", Text = "Сырьё не хранится в транспортной таре" },
            new() { Id = 17, Section = "📦 ХРАНЕНИЕ", Text = "Соблюдение товарного соседства" },
            new() { Id = 18, Section = "📦 ХРАНЕНИЕ", Text = "П/ф в закрытых контейнерах, гастроёмкости чистые" },
            new() { Id = 19, Section = "📦 ХРАНЕНИЕ", Text = "В гастроёмкостях нет ложек" },
            new() { Id = 20, Section = "📦 ХРАНЕНИЕ", Text = "На вскрытых упаковках — даты вскрытия и годности" },
            new() { Id = 21, Section = "📦 ХРАНЕНИЕ", Text = "Разные категории продуктов не в одном контейнере" },
            new() { Id = 22, Section = "🔍 КАЧЕСТВО", Text = "Нет признаков порчи (плесень, гниль)" },
            new() { Id = 23, Section = "🔍 КАЧЕСТВО", Text = "Отсутствие инородных тел в продуктах" },
            new() { Id = 24, Section = "🥄 ИНВЕНТАРЬ", Text = "Чистый инвентарь в промаркированном гастрике" }
        };
    }

    public async Task<List<CheckItem>> GetTodayChecksAsync()
    {
        if (_database == null) await InitializeAsync();
        var today = DateTime.Now.ToString("yyyy-MM-dd");
        return await _database!.Table<CheckItem>().Where(x => x.Date == today).ToListAsync();
    }

    public async Task SaveCheckAsync(int id, string? status, string? note)
    {
        if (_database == null) await InitializeAsync();
        var today = DateTime.Now.ToString("yyyy-MM-dd");

        var existing = await _database!.Table<CheckItem>()
            .FirstOrDefaultAsync(x => x.Id == id && x.Date == today);

        if (existing != null)
        {
            existing.Status = status;
            existing.Note = note;
            await _database.UpdateAsync(existing);
        }
        else
        {
            var newItem = new CheckItem
            {
                Id = id,
                Section = GetInitialChecklistData().First(x => x.Id == id).Section,
                Text = GetInitialChecklistData().First(x => x.Id == id).Text,
                Status = status,
                Note = note,
                Date = today
            };
            await _database.InsertAsync(newItem);
        }
    }

    public async Task<int> SaveInspectionReportAsync(string inspector, int total, int passed, int failed, int percent, string detailsJson)
    {
        if (_database == null) await InitializeAsync();
        var report = new InspectionReport
        {
            Date = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            Inspector = inspector,
            TotalItems = total,
            Passed = passed,
            Failed = failed,
            Percent = percent,
            DetailsJson = detailsJson
        };
        return await _database!.InsertAsync(report);
    }

    public async Task<List<InspectionReport>> GetReportsAsync(int limit = 50)
    {
        if (_database == null) await InitializeAsync();
        return await _database!.Table<InspectionReport>()
            .OrderByDescending(x => x.Id)
            .Take(limit)
            .ToListAsync();
    }

    public async Task ClearTodayDataAsync()
    {
        if (_database == null) await InitializeAsync();
        var today = DateTime.Now.ToString("yyyy-MM-dd");
        await _database!.ExecuteAsync($"DELETE FROM CheckItem WHERE Date = ?", today);
    }
}