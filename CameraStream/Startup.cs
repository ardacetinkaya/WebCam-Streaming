namespace CameraStream
{
    using CameraStream.Hubs;
    using CameraStream.Models;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Hosting;
    using System.Collections.Generic;

    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddRazorPages().AddRazorRuntimeCompilation();

            services.AddCors(options =>
            {
                options.AddPolicy("CorsPolicy", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
            });

            services.AddSignalR();

            services.AddSingleton<List<User>>();
            services.AddSingleton<List<Connection>>();
            services.AddSingleton<List<Call>>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseCors("CorsPolicy");

            app.UseRouting();

            app.UseAuthorization();

            app.UseStreamSocket();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
                endpoints.MapHub<ConnectionHub>("/cnnctn", options =>
                {
                    options.Transports = Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets;
                });
            });
        }

    }
}
