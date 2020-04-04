# WebCam Streaming
 
This is a simple proof of concept work for demonstration of web-cam streaming in ASP.NET Core web applications, with web-sockets and also SignalR Core.
 
In this ASP.NET Core web app., there is two different approach for web-cam streams;

1. System.Net.WebSockets.WebSocket
2. SignalR Core

<p align="center"><img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-1.png" width="650px"/></p>


In first demonstration; a web-socket connection is initialized with client-side and server-side. In client-side, the web-cam streams are delivered to server-side as image frames, *.jpeg. In server-side frames' data from socket modified as grayscale and streamed back to the client-side as base64 string as image format. In client-side every frame is delivered to server with in FPS approach to have no video glitch. 

Within this demostration; within an ASP.NET Core application, basically client-side web-cam video is captured and delivered to server-side. In server-side some modification is done and send back to client-side. (Just for some fun 😀)

 <p align="center"><img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-1.gif"/></p>


In second demonstration; ASP.NET Core SignalR approached are used to stream web-cam video between two clients.

 
<p align="center"><img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-2.png"/></p>
<p align="center"><img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-3.png"/></p>



 <img src="https://github.com/ardacetinkaya/WebCam-Streaming/blob/master/Example-2.gif"/>
 
