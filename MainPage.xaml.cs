using ChefCheckApp.Services;

namespace ChefCheckApp;

public partial class MainPage : ContentPage
{
    private readonly IServiceProvider _services;

    public MainPage(IServiceProvider services)
    {
        InitializeComponent();
        _services = services;
    }

    private async void OnChecklistClicked(object sender, EventArgs e)
    {
        var checklistPage = _services.GetRequiredService<ChecklistPage>();
        await Navigation.PushAsync(checklistPage);
    }
}