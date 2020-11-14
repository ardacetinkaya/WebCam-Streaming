# 🎥 WebCam Streaming 
 
This is a simple proof of concept work for demonstration of web-cam streaming in **ASP.NET Core** web applications, with **web-sockets** and also **ASP.NET Core SignalR**.
 
In this ASP.NET Core web app., there are currently two different approaches for web-cam streams;

1. **System.Net.WebSockets.WebSocket**
2. **ASP.NET Core SignalR**
3. _WebRTC (Coming soon)_

<p align="center"><img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-1.png" width="650px"/></p>


In first demonstration; a web-socket connection is initialized with client-side and server-side. In client-side, the web-cam streams are delivered to server-side as image frames, *.jpeg. In server-side frames' data from socket modified as grayscale and streamed back to the client-side as base64 string as image format. In client-side every frame is delivered to server with in FPS approach to have no video glitch. 

Within this demostration; within an ASP.NET Core application, basically client-side web-cam video is captured and delivered to server-side. In server-side some modification is done and send back to client-side. (Just for some fun 😀)

 <p align="center"><img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-1.gif"/></p>


In second demonstration, the scenario is simple and also fun(😀); **ASP.NET Core SignalR** approached are used to stream web-cam video between two clients. Two different clients access to same **ASP.NET Core Web Application(Razor)**. Client-A (at the right side) calls Client-B(left one), then a notification pop-up appears in Client-B to accept or decline the call.

<img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-2.png" width="800px"/>

<img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-3.png" width="800px"/>

After Client-B accepts the call, a connection is established within Client-A and Client-B with ASP.NET Core SignalR Hub approach. In this scenario, who makes the call can share web-cam video stream with client. So when Client-A opens the camera, Client-A streams the web-cam video into the server-side, SignalR Hub. From the hub, streamed data is send to Client-B within standart method calls in client-side.

 <p align="center"><img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-2.gif"/></p>
 
This was just for a weekend fun to see what is possible within ASP.NET Core applications. I am happy with the results so here is this repository. 😀 

References for more fun:
- [Use streaming in ASP.NET Core SignalR](https://docs.microsoft.com/en-us/aspnet/core/signalr/streaming)
- [WebSockets support in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/websockets)
