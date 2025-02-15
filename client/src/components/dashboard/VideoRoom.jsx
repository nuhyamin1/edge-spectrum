import React, { useState, useEffect } from 'react';
import { AgoraVideoPlayer, createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-react';

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

  useEffect(() => {
    // Function to handle user published events
    const handleUserPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          setUsers((prevUsers) => {
            if (!prevUsers.find(u => u.uid === user.uid)) {
              return [...prevUsers, user];
            }
            return prevUsers;
          });
        }
        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play();
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
      if (mediaType === "video") {
        setUsers((prevUsers) => prevUsers.filter((User) => User.uid !== user.uid));
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

        await client.join(config.appId, sessionId, null, null);
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
        
        // Only try to unpublish and leave if we have tracks
        if (tracks) {
          client.unpublish(tracks).then(() => {
            client.leave();
          }).catch(console.error);
        }
      } catch (err) {
        console.error("Error during cleanup:", err);
      }
    };
  }, [sessionId, client, ready, tracks]);

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
              {isTeacher ? 'Teacher' : 'You'}
            </div>
          </div>
        )}
        {users.length > 0 &&
          users.map((user) => {
            if (user.videoTrack) {
              return (
                <div key={user.uid} className="relative bg-white rounded-lg shadow-md overflow-hidden aspect-video">
                  <div className="absolute inset-0">
                    <AgoraVideoPlayer
                      videoTrack={user.videoTrack}
                      style={{ height: '100%', width: '100%' }}
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                    {isTeacher ? `Student ${user.uid}` : user.uid === 'teacher' ? 'Teacher' : `Student ${user.uid}`}
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
