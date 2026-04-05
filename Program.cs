using Microsoft.EntityFrameworkCore;
using newkaraoke.Models.db;
using newkaraoke.Services;
using Pomelo.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();

var server   = Environment.GetEnvironmentVariable("DB_Server");
var port     = Environment.GetEnvironmentVariable("DB_PORT");
var database = Environment.GetEnvironmentVariable("DB_DATABASE");
var user     = Environment.GetEnvironmentVariable("DB_USER");
var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
var baseConn = builder.Configuration.GetConnectionString("DefaultConnection");

var connectionString =
    $"server={server};port={port};database={database};user={user};password={password};{baseConn}";

builder.Services.AddDbContext<KaraokeDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

builder.Services.AddControllersWithViews();

builder.Services.AddSession(options =>
{
    options.IdleTimeout        = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly    = true;
    options.Cookie.IsEssential = true;
});

// ── Logging ──────────────────────────────────────────────
builder.Services.AddHttpContextAccessor(); // ให้ LogService ดึง IP / UserAgent ได้
builder.Services.AddScoped<LogService>();  // Scoped = 1 instance ต่อ 1 request

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseSession();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(name: "default", pattern: "{controller=User}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
