import React, { useState, useEffect, useRef } from 'react';
import { AgoraVideoPlayer, createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useAuth } from '../../context/AuthContext';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaTimesCircle, FaExpand, FaCompress } from 'react-icons/fa';

const config = {
  mode: "rtc",
  codec: "vp8",
  appId: "47900e7641694ee59eefb1b7a2b4cff7"
};

// Custom hook for screen sharing
const useScreenShare = (client, userId) => {
  const [screenTrack, setScreenTrack] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState(null);
  const [previousVideoTrack, setPreviousVideoTrack] = useState(null);

  const startScreenShare = async () => {
    try {
      // Store and unpublish the current video track if it exists
      const localTracks = client.localTracks;
      const videoTrack = localTracks.find(track => track.trackMediaType === "video");
      
      if (videoTrack) {
        setPreviousVideoTrack(videoTrack);
        await client.unpublish(videoTrack);
      }

      // Create screen sharing track
      const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrateMin: 500,
          bitrateMax: 1000,
        },
        optimizationMode: "detail",
        screenSourceType: "screen"
      });

      // Set up screen sharing ended event
      screenVideoTrack.on("track-ended", async () => {
        await stopScreenShare();
      });

      await client.publish(screenVideoTrack);
      setScreenTrack(screenVideoTrack);
      setIsScreenSharing(true);

    } catch (error) {
      setError(error.message);
      console.error("Screen sharing failed:", error);
      
      // If screen sharing fails, republish the previous video track
      if (previousVideoTrack) {
        try {
          await client.publish(previousVideoTrack);
          setPreviousVideoTrack(null);
        } catch (e) {
          console.error("Failed to restore camera track:", e);
        }
      }
    }
  };

  const stopScreenShare = async () => {
    try {
      if (screenTrack) {
        screenTrack.close();
        await client.unpublish(screenTrack);
        setScreenTrack(null);
        setIsScreenSharing(false);

        // Republish the previous video track if it exists
        if (previousVideoTrack) {
          await client.publish(previousVideoTrack);
          setPreviousVideoTrack(null);
        }
      }
    } catch (error) {
      setError(error.message);
      console.error("Error stopping screen share:", error);
    }
  };

  return {
    screenTrack,
    isScreenSharing,
    error,
    startScreenShare,
    stopScreenShare
  };
};

// Quality monitoring hook
const useQualityMonitor = (client) => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    let interval;
    if (client) {
      interval = setInterval(async () => {
        try {
          const networkQuality = client.getRemoteNetworkQuality();
          const connection = client.getLocalVideoStats();
          
          setStats({
            networkType: navigator.connection?.type || 'unknown',
            networkQuality: networkQuality,
            sendBitrate: connection.sendBitrate,
            sendFrameRate: connection.sendFrameRate,
            sendResolution: `${connection.sendResolutionWidth}x${connection.sendResolutionHeight}`,
            lastMileDelay: connection.delay || 0
          });
        } catch (error) {
          console.error("Error getting stats:", error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [client]);

  return stats;
};

const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const VideoRoom = ({ sessionId, isTeacher, session }) => {
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);
  const [error, setError] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [remoteScreenTrack, setRemoteScreenTrack] = useState(null);
  const [remoteScreenUser, setRemoteScreenUser] = useState(null);
  const [videoPosition, setVideoPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const client = useClient();
  const { ready, tracks } = useMicrophoneAndCameraTracks();
  const { user } = useAuth();
  
  // Use our custom hooks
  const { 
    screenTrack, 
    isScreenSharing, 
    error: screenShareError, 
    startScreenShare, 
    stopScreenShare 
  } = useScreenShare(client, user.id);
  
  const qualityStats = useQualityMonitor(client);

  const toggleAudio = async () => {
    if (tracks && tracks[0]) {
      await tracks[0].setEnabled(!isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = async () => {
    if (tracks && tracks[1]) {
      await tracks[1].setEnabled(!isVideoMuted);
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      await startScreenShare();
    } else {
      await stopScreenShare();
    }
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    dragStartPos.current = {
      x: touch.clientX - videoPosition.x,
      y: touch.clientY - videoPosition.y
    };
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    setVideoPosition({
      x: touch.clientX - dragStartPos.current.x,
      y: touch.clientY - dragStartPos.current.y
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    // Function to handle user published events
    const handleUserPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        
        if (mediaType === "video") {
          const videoTrack = user.videoTrack;
          
          // Check if this is a screen sharing track
          if (videoTrack && videoTrack._source === "screen") {
            console.log("Received screen share from:", user.uid);
            setRemoteScreenTrack(videoTrack);
            setRemoteScreenUser(user);
          } else {
            // Handle regular video track
            setUsers((prevUsers) => {
              const existingUser = prevUsers.find(u => u.uid === user.uid);
              if (existingUser) {
                return prevUsers.map(u => 
                  u.uid === user.uid 
                    ? { ...u, videoTrack }
                    : u
                );
              }
              return [...prevUsers, { ...user, videoTrack }];
            });
          }
        }
        
        if (mediaType === "audio") {
          const audioTrack = user.audioTrack;
          audioTrack?.play();
          setUsers((prevUsers) => {
            const existingUser = prevUsers.find(u => u.uid === user.uid);
            if (existingUser) {
              return prevUsers.map(u => 
                u.uid === user.uid 
                  ? { ...u, audioTrack }
                  : u
              );
            }
            return [...prevUsers, { ...user, audioTrack }];
          });
        }
      } catch (err) {
        console.error("Error subscribing to user:", err);
        setError("Failed to connect to other participants");
      }
    };

    // Function to handle user unpublished events
    const handleUserUnpublished = (user, mediaType) => {
      if (mediaType === "video") {
        // Check if this was the screen sharing user
        if (remoteScreenUser && user.uid === remoteScreenUser.uid) {
          console.log("Screen share ended from:", user.uid);
          setRemoteScreenTrack(null);
          setRemoteScreenUser(null);
        } else {
          setUsers((prevUsers) => 
            prevUsers.map(u => 
              u.uid === user.uid 
                ? { ...u, videoTrack: null }
                : u
            ).filter(u => u.videoTrack || u.audioTrack)
          );
        }
      }
      
      if (mediaType === "audio") {
        user.audioTrack?.stop();
        setUsers((prevUsers) => 
          prevUsers.map(u => 
            u.uid === user.uid 
              ? { ...u, audioTrack: null }
              : u
          ).filter(u => u.videoTrack || u.audioTrack)
        );
      }
    };

    // Function to handle user left events
    const handleUserLeft = (user) => {
      setUsers((prevUsers) => prevUsers.filter((User) => User.uid !== user.uid));
    };

    const init = async () => {
      try {
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-left", handleUserLeft);

        // Generate a unique ID for the user
        const uid = isTeacher ? 'teacher' : `${user.id}_${Math.floor(Math.random() * 1000000)}`;

        // Join channel with the unique ID
        await client.join(config.appId, sessionId, null, uid);

        if (tracks) {
          await client.publish(tracks);
          setStart(true);
        }
      } catch (err) {
        console.error("Error joining video room:", err);
        setError("Failed to join video room");
      }
    };

    if (ready && tracks) {
      console.log("Initializing with tracks:", tracks);
      init();
    }

    // Cleanup function
    return () => {
      try {
        client.off("user-published", handleUserPublished);
        client.off("user-unpublished", handleUserUnpublished);
        client.off("user-left", handleUserLeft);

        if (tracks) {
          tracks.forEach(track => {
            if (track) {
              track.stop();
              track.close();
            }
          });
        }
        
        if (tracks) {
          client.unpublish(tracks).then(() => {
            client.leave();
          }).catch(console.error);
        }
      } catch (err) {
        console.error("Error during cleanup:", err);
      }
    };
  }, [sessionId, client, ready, tracks, isTeacher, user.name]);

  useEffect(() => {
    return () => {
      if (screenTrack) {
        screenTrack.close();
      }
    };
  }, [screenTrack]);

  const QualityMonitor = ({ stats }) => {
    if (!stats || Object.keys(stats).length === 0) return null;

    const getNetworkQualityText = (quality) => {
      switch(quality) {
        case 1: return 'Excellent';
        case 2: return 'Good';
        case 3: return 'Poor';
        case 4: return 'Bad';
        case 5: return 'Very Bad';
        default: return 'Unknown';
      }
    };

    return (
      <div className="fixed bottom-4 right-4 bg-black/50 text-white p-4 rounded-lg text-sm">
        <h3 className="font-bold mb-2">Network Stats</h3>
        <div className="space-y-1">
          <p>Network: {stats.networkType}</p>
          <p>Quality: {getNetworkQualityText(stats.networkQuality)}</p>
          <p>Latency: {stats.lastMileDelay}ms</p>
          <p>Send Bitrate: {(stats.sendBitrate / 1024).toFixed(1)} Mbps</p>
          <p>Frame Rate: {stats.sendFrameRate} fps</p>
          <p>Resolution: {stats.sendResolution}</p>
        </div>
      </div>
    );
  };

  const ErrorDisplay = ({ error }) => {
    if (!error) return null;

    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  };

  if (error) {
    return (
      <div className="h-full w-full bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow">
          <p className="font-medium">Error: {error}</p>
          <p className="text-sm mt-2">Please refresh the page and try again.</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="h-full w-full bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Initializing video... Please allow camera and microphone access.</p>
        </div>
      </div>
    );
  }

  // Filter out teacher from users list
  const teacherUser = users.find(u => u.uid === 'teacher');
  const studentUsers = users.filter(u => u.uid !== 'teacher');

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Error display */}
      <ErrorDisplay error={error || screenShareError} />
      
      {/* Quality monitor */}
      <QualityMonitor stats={qualityStats} />
      
      {/* Screen Share Display with Floating Video */}
      {(isScreenSharing || remoteScreenTrack) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 p-4">
          <div className="relative h-full">
            {isScreenSharing && (
              <button
                onClick={stopScreenShare}
                className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 z-10"
              >
                <FaTimesCircle size={24} />
              </button>
            )}
            <AgoraVideoPlayer
              videoTrack={isScreenSharing ? screenTrack : remoteScreenTrack}
              style={{ height: '100%', width: '100%', objectFit: 'contain' }}
            />
            
            {/* Floating Video Window */}
            {tracks && tracks[1] && !isVideoMuted && (
              <div
                className={`absolute cursor-move rounded-lg overflow-hidden shadow-lg transition-all ${
                  isVideoExpanded ? 'w-96 h-72' : 'w-48 h-36'
                }`}
                style={{
                  left: `${videoPosition.x}px`,
                  top: `${videoPosition.y}px`,
                  touchAction: 'none'
                }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <div className="relative w-full h-full">
                  <AgoraVideoPlayer
                    videoTrack={tracks[1]}
                    style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75"
                  >
                    {isVideoExpanded ? <FaCompress size={16} /> : <FaExpand size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full">
        {/* Left Column - Teacher and Session Info */}
        <div className="flex flex-col space-y-4">
          {/* Teacher Video */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {isTeacher && start && tracks ? (
              <div className="relative aspect-video">
                <div className="absolute inset-0">
                  <AgoraVideoPlayer
                    videoTrack={tracks[1]}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  {user.name} (Teacher)
                </div>
              </div>
            ) : teacherUser?.videoTrack ? (
              <div className="relative aspect-video">
                <div className="absolute inset-0">
                  <AgoraVideoPlayer
                    videoTrack={teacherUser.videoTrack}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  Teacher
                </div>
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Teacher video not available</p>
              </div>
            )}
          </div>

          {/* Session Details */}
          {session && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">{session.title}</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-600 w-32">Subject:</span>
                  <span className="text-gray-900">{session.subject}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-32">Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    session.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
                {session.startedAt && (
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Started:</span>
                    <span className="text-gray-900">
                      {new Date(session.startedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-gray-600 w-32">Duration:</span>
                  <span className="text-gray-900">{session.duration} minutes</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-32">Grace Period:</span>
                  <span className="text-gray-900">{session.gracePeriod} minutes</span>
                </div>
                {session.description && (
                  <div className="mt-4">
                    <span className="text-gray-600 block mb-2">Description:</span>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {session.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Student Videos */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Participants ({studentUsers.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isTeacher && start && tracks && (
              <div className="relative aspect-video bg-white rounded-lg shadow-md overflow-hidden">
                <div className="absolute inset-0">
                  <AgoraVideoPlayer
                    videoTrack={tracks[1]}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  {user.name} (You)
                </div>
              </div>
            )}
            {studentUsers.map((remoteUser) => {
              if (remoteUser.videoTrack) {
                const displayName = remoteUser.uid.includes('_') 
                  ? remoteUser.uid.split('_')[0] 
                  : `Student ${remoteUser.uid}`;

                return (
                  <div key={remoteUser.uid} className="relative aspect-video bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="absolute inset-0">
                      <AgoraVideoPlayer
                        videoTrack={remoteUser.videoTrack}
                        style={{ height: '100%', width: '100%' }}
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                      {displayName}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-black/50 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${isVideoMuted ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          {isVideoMuted ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-500' : 'bg-blue-500'}`}
          disabled={!ready}
        >
          <FaDesktop />
        </button>
      </div>
    </div>
  );
};

export default VideoRoom;
