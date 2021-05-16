console.log("Document loaded")

var server = "http://192.168.87.123:8088/janus";

var janus;
var mixertest;
var opaqueId;
var webrtcUp = false;
var stream;
var audioenabled = false;
var myroom = 1234;	// Demo room
if(getQueryStringValue("room") !== "")
	myroom = parseInt(getQueryStringValue("room"));

//Some other vars I guess


Janus.init({debug: "all", callback: function() {

    //Escapes init if webrtc isn't supported.
    if(!Janus.isWebrtcSupported()) {
        bootbox.alert("No WebRTC support... ");
        return;
    }
    
    //New Janus instance created. All code is in the init of this instance.
    janus = new Janus({

        server: server, 
        success: function() {

            console.log("Connection to " + server + " established.");

            console.log("Attempting to attach audiobridge plugin");

            //Attaching plugin
            janus.attach({
                plugin: "janus.plugin.audiobridge",
				opaqueId: opaqueId,
                success: function(pluginHandle) {
					mixertest = pluginHandle;
					Janus.log("Plugin attached! (" + mixertest.getPlugin() + ", id=" + mixertest.getId() + ")");
					
				},
				error: function(error) {
					Janus.error("Plugin error", error);
				
                },
                mediaState: function(medium, on) {
                    Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
                },
                webrtcState: function(on) {
                    Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                },
                onmessage: function(msg, jsep) {
                    Janus.debug(" ::: Got a message :::", msg);
                    var event = msg["audiobridge"];
                    if(event) {
                        if(event === "joined") {
                            console.log("Okay we are joined in VC")
                            if(!webrtcUp) {
                                webrtcUp = true;
                                // Publish our stream
                                mixertest.createOffer({
                                    media: { video: false},	// This is an audio only room
                                    success: function(jsep) {
                                        Janus.debug("Got SDP!", jsep);
                                        var publish = { request: "configure", muted: false };
                                        mixertest.send({ message: publish, jsep: jsep });
                                    },
                                    error: function(error) {
                                        Janus.error("WebRTC error:", error);
                                    }
                                });
                            }
                        } else if(msg["error"]) {
                            if(msg["error_code"] === 485) {
                               console.log("No such fucking room, buster")
                            } else {
                                console.log(msg["error"]);
                            }
                            return;
                        } 
                    } 
                    if(jsep) {
                        Janus.debug("Handling SDP as well...", jsep);
                        mixertest.handleRemoteJsep({ jsep: jsep });
                    }
                    
                },
                //If someone else joins, attach the audio.
                //I'm not sure if this needs to be changed or what.
                onremotestream: function(stream) {
                    console.log("I think I recieved something, not sure buster")
                    audioenabled = true;
                    yeet = document.createElement("audio")
                    yeet.setAttribute("id", "roomaudio");
                    document.getElementById("field").append(yeet)
                    Janus.attachMediaStream(document.getElementById("roomaudio"), stream);
                    document.getElementById("roomaudio").play();
                }
   
            });
        }
    });
}});

//Call this function when you're ready to connect to audio. It doesn't do it by itself
//It joins the room and listens for events, and then RTP-forwards all voice in the room 
//Gstreamer can pick this up.
//We do it this way because its much faster than to rebuild the dockerimage every time when changing the configs.
function imReadyDaddy() {
    mixertest.send({ message: { request: "join", room: 1234, display: "anal" }});
    mixertest.send({ message: { request: "rtp_forward", room: 1234, host: "localhost", port: 7088, secret: "adminpwd", always_on : true }});
}
//Regex stuff, username filtering.
function getQueryStringValue(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function attachStreaming() {
    janus.attach({
        plugin: "janus.plugin.streaming",
        opaqueId: opaqueId,
        success: function(pluginHandle) {
            stream = pluginHandle;
            Janus.log("Plugin attached");
            
        },
        error: function(error) {
            Janus.error("Plugin error", error);
        },
        webrtcState: function(on) {
            Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
        },
        onremotestream: function(streem) {
            kusse = streem;
            console.log("Audiostream recieved")
            audioenabled = true;
            yeet = document.createElement("audio")
            yeet.setAttribute("id", "roomaudio");
            document.getElementById("field").append(yeet)

            Janus.attachMediaStream(document.getElementById("roomaudio"), streem);
            document.getElementById("roomaudio").play();
            document.getElementById("roomaudio").volume = 1;
            
        },
        onmessage: function(msg, jsep) {
            Janus.debug("STREEEEEEEEEEEEEEEEEEEEEEEM ::: Got a message :::", msg);
            var event = msg["streaming"];
            if(event) {
                console.log("YOUR DAD IS A HOE:::::::::::::::::")
                
            } 
            if(jsep) {
                stream.createAnswer(
                    {
                        jsep: jsep,
                        // We want recvonly audio/video and, if negotiated, datachannels
                        media: { audioSend: false, videoSend: false, data: true },
                        customizeSdp: function(jsep) {
                            //WHatever
                        },
                        success: function(jsep) {
                            Janus.debug("Got SDP!", jsep);
                            var body = { request: "start" };
                            stream.send({ message: body, jsep: jsep });
                        },
                        error: function(error) {
                            Janus.error("WebRTC error:", error);

                        }
                    });
            }
        }
    });
}

function rtpRecieveRequest() {

    stream.send({ message:{
        request : "create",
        type : "rtp", 
        description : "Recieve RTP audio from GStreamer",
        secret : "adminpwd",
        is_private : false,
        audio : true,
        video: false,
        audioport : 7089,
        audiopt: 111,
        audiortpmap: "opus/48000/2",
        media: [{type: "audio"}]
        } 
    });
}

//For quick testing
function watch(cum) {
    stream.send({ message:{
        request : "watch",
        id: cum
        }
    });
}

function info(cum) {
    stream.send({ message:{
        request : "info",
        id : cum,
        secret : "adminpwd"
        } 
    });  
}

function itsTimeToStop() {
    stream.send({ message:{
        request : "stop"
        }  
    });
}

function enlightenMeDaddy() {
    stream.send({ message:{
        request : "list"
        }  
    });
}

function sendAccept() {
    stream.send({ message:{
        request : "start"
        } 
    });
    stream.send({ message: { request: "configure", muted: false }});
}