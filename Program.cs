using newkaraoke.Models.db;
using Pomelo.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();

var server = Environment.GetEnvironmentVariable("DB_Server");
var port = Environment.GetEnvironmentVariable("DB_PORT");
var database = Environment.GetEnvironmentVariable("DB_DATABASE");
var user = Environment.GetEnvironmentVariable("DB_USER");
var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
var baseConn = builder.Configuration.GetConnectionString("DefaultConnection");

var connectionString = $"server={server};port={port};database={database};user={user};password={password};{baseConn}";
// Console.WriteLine(connectionString);

builder.Services.AddDbContext<KaraokeDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect((connectionString))
    ));
    
// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Index}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
