using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace CameraStream.Pages
{
    public class WebRTCModel : PageModel
    {
        private readonly ILogger<WebRTCModel> _logger;

        public WebRTCModel(ILogger<WebRTCModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
        }
    }
}
