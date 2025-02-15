import React, { useState, useEffect } from 'react';
import { AgoraVideoPlayer, createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-react';
import { useAuth } from '../../context/AuthContext';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';

const config = {
  mode: "rtc",
  codec: "vp8",
  appId: "47900e7641694ee59eefb1b7a2b4cff7"
};

const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const VideoRoom = ({ sessionId, isTeacher, session }) => {
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);
  const [error, setError] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const client = useClient();
  const { ready, tracks } = useMicrophoneAndCameraTracks();
  const { user } = useAuth();

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

  useEffect(() => {
    // Function to handle user published events
    const handleUserPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        
        if (mediaType === "video") {
          setUsers((prevUsers) => {
            const existingUser = prevUsers.find(u => u.uid === user.uid);
            if (existingUser) {
              return prevUsers.map(u => 
                u.uid === user.uid 
                  ? { ...u, videoTrack: user.videoTrack }
                  : u
              );
            }
            return [...prevUsers, user];
          });
        }
        
        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play();
          setUsers((prevUsers) => {
            const existingUser = prevUsers.find(u => u.uid === user.uid);
            if (existingUser) {
              return prevUsers.map(u => 
                u.uid === user.uid 
                  ? { ...u, audioTrack: user.audioTrack }
                  : u
              );
            }
            return [...prevUsers, user];
          });
        }
      } catch (err) {
        console.error("Error subscribing to user:", err);
        setError("Failed to connect to other participants");
      }
    };

    // Function to handle user unpublished events
    const handleUserUnpublished = (user, mediaType) => {
      if (mediaType === "audio" && user.audioTrack) {
        user.audioTrack.stop();
      }
      setUsers((prevUsers) => {
        return prevUsers.map(u => {
          if (u.uid === user.uid) {
            return {
              ...u,
              ...(mediaType === "audio" && { audioTrack: null }),
              ...(mediaType === "video" && { videoTrack: null })
            };
          }
          return u;
        }).filter(u => u.videoTrack || u.audioTrack);
      });
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
        const uid = isTeacher ? 'teacher' : `${user.name}_${Math.floor(Math.random() * 1000000)}`;

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
    <div className="h-full w-full bg-gray-100 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
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
      <div className="absolute bottom-4 right-4 flex space-x-4">
        <button
          className="bg-gray-100 p-2 rounded-lg shadow-md hover:bg-gray-200"
          onClick={toggleAudio}
        >
          {isAudioMuted ? (
            <FaMicrophoneSlash size={20} color="#666" />
          ) : (
            <FaMicrophone size={20} color="#666" />
          )}
        </button>
        <button
          className="bg-gray-100 p-2 rounded-lg shadow-md hover:bg-gray-200"
          onClick={toggleVideo}
        >
          {isVideoMuted ? (
            <FaVideoSlash size={20} color="#666" />
          ) : (
            <FaVideo size={20} color="#666" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoRoom;
