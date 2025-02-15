import React, { useState, useEffect } from 'react';
import { AgoraVideoPlayer, createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-react';
import { useAuth } from '../../context/AuthContext';

const config = {
  mode: "rtc",
  codec: "vp8",
  appId: "47900e7641694ee59eefb1b7a2b4cff7"
};

const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const VideoRoom = ({ sessionId, isTeacher }) => {
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);
  const [error, setError] = useState(null);
  const client = useClient();
  const { ready, tracks } = useMicrophoneAndCameraTracks();
  const { user } = useAuth();

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

  console.log("Current users in room:", users);

  return (
    <div className="h-full w-full bg-gray-100 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
        {start && tracks && (
          <div className="relative bg-white rounded-lg shadow-md overflow-hidden aspect-video">
            <div className="absolute inset-0">
              <AgoraVideoPlayer
                videoTrack={tracks[1]}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              {user.name} {isTeacher ? '(Teacher)' : ''}
            </div>
          </div>
        )}
        {users.length > 0 &&
          users.map((remoteUser) => {
            if (remoteUser.videoTrack) {
              // Extract username from uid if it contains the user's name
              const displayName = remoteUser.uid === 'teacher' 
                ? 'Teacher'
                : remoteUser.uid.includes('_') 
                  ? remoteUser.uid.split('_')[0] 
                  : `Student ${remoteUser.uid}`;

              return (
                <div key={remoteUser.uid} className="relative bg-white rounded-lg shadow-md overflow-hidden aspect-video">
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
  );
};

export default VideoRoom;
