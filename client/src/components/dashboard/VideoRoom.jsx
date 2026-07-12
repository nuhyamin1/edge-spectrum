import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AgoraVideoPlayer, createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useAuth } from '../../context/AuthContext';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaTimesCircle, FaExpand, FaCompress, FaEdit, FaHandPaper, FaUsers, FaComments, FaChevronUp, FaChevronDown, FaGripVertical, FaCircle, FaStop, FaStar, FaThumbsUp, FaChevronLeft, FaChevronRight, FaVolumeUp, FaBook, FaThumbtack } from 'react-icons/fa';
import Whiteboard from './Whiteboard';
import io from 'socket.io-client';
import './VideoRoom.css';
import axios from 'axios';

const config = {
  mode: "rtc",
  codec: "vp8",
  appId: "47900e7641694ee59eefb1b7a2b4cff7"
};

const MAX_VIDEO_ROOM_STUDENTS = 40;
const DESKTOP_PARTICIPANTS_PER_PAGE = 8;
const MOBILE_PARTICIPANTS_PER_PAGE = 4;
const REMOTE_STREAM_HIGH = 0;
const REMOTE_STREAM_LOW = 1;
const SCREEN_SHARE_UID_PREFIX = 'screen-share___';
const PRONUNCIATION_DIALECTS = [
  { value: 'en-US', label: 'American English (AmE)' },
  { value: 'en-GB', label: 'British English (BrE)' }
];

const getUidString = (uid) => String(uid || '');

const getParticipantName = (uid) => {
  const uidString = getUidString(uid);
  return uidString.includes('___')
    ? uidString.split('___')[0]
    : `Student ${uidString}`;
};

const getParticipantUserId = (uid) => {
  const uidString = getUidString(uid);
  return uidString.includes('___')
    ? uidString.split('___')[1].split('_')[0]
    : uidString;
};

const getVideoElementId = (prefix, uid) =>
  `${prefix}-${getUidString(uid).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

const isScreenShareUid = (uid) => getUidString(uid).startsWith(SCREEN_SHARE_UID_PREFIX);

const getScreenShareOwnerId = (uid) => {
  const uidString = getUidString(uid);
  if (!isScreenShareUid(uidString)) return null;
  return uidString.slice(SCREEN_SHARE_UID_PREFIX.length).split('_')[0];
};

// Custom hook for screen sharing
const useScreenShare = (channelName, ownerId) => {
  const [screenTrack, setScreenTrack] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState(null);
  const screenTrackRef = useRef(null);
  const screenClientRef = useRef(null);
  const isStoppingScreenShareRef = useRef(false);

  const startScreenShare = async () => {
    try {
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

      screenTrackRef.current = screenVideoTrack;
      const screenClient = AgoraRTC.createClient({ mode: config.mode, codec: config.codec });
      screenClientRef.current = screenClient;

      // Set up screen sharing ended event
      screenVideoTrack.on("track-ended", async () => {
        await stopScreenShare();
      });

      const screenUid = `${SCREEN_SHARE_UID_PREFIX}${ownerId}_${Math.floor(Math.random() * 1000000)}`;
      await screenClient.join(config.appId, channelName, null, screenUid);
      await screenClient.publish(screenVideoTrack);
      setScreenTrack(screenVideoTrack);
      setIsScreenSharing(true);
      setError(null);
      return true;

    } catch (error) {
      setError(error.message);
      console.error("Screen sharing failed:", error);

      if (screenClientRef.current && screenClientRef.current.connectionState !== 'DISCONNECTED') {
        try {
          await screenClientRef.current.leave();
        } catch (leaveError) {
          console.warn('Could not leave the screen-share channel:', leaveError);
        }
      }
      screenClientRef.current = null;

      if (screenTrackRef.current) {
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      setScreenTrack(null);
      setIsScreenSharing(false);
      return false;
    }
  };

  const stopScreenShare = async () => {
    if (isStoppingScreenShareRef.current) return;
    isStoppingScreenShareRef.current = true;

    const activeScreenTrack = screenTrackRef.current;
    const screenClient = screenClientRef.current;

    try {
      if (screenClient?.connectionState === 'CONNECTED' && activeScreenTrack) {
        await screenClient.unpublish(activeScreenTrack);
      }
      if (screenClient && screenClient.connectionState !== 'DISCONNECTED') {
        await screenClient.leave();
      }
    } catch (error) {
      setError(error.message);
      console.error("Error stopping screen share:", error);
    } finally {
      activeScreenTrack?.close();
      screenTrackRef.current = null;
      screenClientRef.current = null;
      setScreenTrack(null);
      setIsScreenSharing(false);
      isStoppingScreenShareRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      const activeScreenTrack = screenTrackRef.current;
      const screenClient = screenClientRef.current;

      if (screenClient?.connectionState === 'CONNECTED' && activeScreenTrack) {
        screenClient.unpublish(activeScreenTrack).catch(() => {});
      }
      if (screenClient && screenClient.connectionState !== 'DISCONNECTED') {
        screenClient.leave().catch(() => {});
      }
      activeScreenTrack?.close();
      screenTrackRef.current = null;
      screenClientRef.current = null;
    };
  }, []);

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

// Custom hook for recording
const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async (stream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        chunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
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
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const [currentBreakoutRoom, setCurrentBreakoutRoom] = useState(null);
  const [breakoutMessage, setBreakoutMessage] = useState('');
  const [isRoomListCollapsed, setIsRoomListCollapsed] = useState(false);
  const [roomListPosition, setRoomListPosition] = useState({ x: window.innerWidth - 240, y: 20 });
  const [isRoomListDragging, setIsRoomListDragging] = useState(false);
  const roomListDragStart = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const cameraPictureInPictureRef = useRef(null);
  const wasScreenSharingRef = useRef(false);
  const client = useClient();
  const { ready, tracks } = useMicrophoneAndCameraTracks();
  const { user } = useAuth();
  const activeAgoraChannel = currentBreakoutRoom
    ? `${sessionId}_breakout_${currentBreakoutRoom}`
    : sessionId;
  const screenShareOwnerId = isTeacher ? 'teacher' : user.id;
  
  // Use our custom hooks
  const { 
    screenTrack, 
    isScreenSharing, 
    error: screenShareError, 
    startScreenShare, 
    stopScreenShare 
  } = useScreenShare(activeAgoraChannel, screenShareOwnerId);
  
  const qualityStats = useQualityMonitor(client);
  const { isRecording, startRecording, stopRecording } = useRecording();
  const recordingStreamRef = useRef(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const socketRef = useRef(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackTimeoutRef = useRef(null);
  const pronunciationAudioContextRef = useRef(null);
  const pronunciationAudioSourceRef = useRef(null);
  const [showFeedbackPalette, setShowFeedbackPalette] = useState(false);
  const [pronunciationDialect, setPronunciationDialect] = useState('en-US');
  const [pronunciationError, setPronunciationError] = useState(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionaryWord, setDictionaryWord] = useState('');
  const [dictionaryResult, setDictionaryResult] = useState(null);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);
  const [dictionaryError, setDictionaryError] = useState(null);
  const [dictionaryLanguage, setDictionaryLanguage] = useState('en');
  const [participantPage, setParticipantPage] = useState(0);
  const [pinnedParticipantUid, setPinnedParticipantUid] = useState(null);
  const [activeSpeakerUid, setActiveSpeakerUid] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isCameraPictureInPicture, setIsCameraPictureInPicture] = useState(false);

  useEffect(() => {
    const setTrackEnabled = async () => {
      if (tracks && tracks[0]) {
        await tracks[0].setEnabled(!isAudioMuted);
      }
    };
    setTrackEnabled();
  }, [isAudioMuted, tracks]);
  
  const toggleAudio = () => {
    setIsAudioMuted(prev => !prev);
  };

  useEffect(() => {
    const setTrackEnabled = async () => {
      if (tracks && tracks[1]) {
        await tracks[1].setEnabled(!isVideoMuted);
      }
    };
    setTrackEnabled();
  }, [isVideoMuted, tracks]);
  
  const toggleVideo = () => {
    setIsVideoMuted(prev => !prev);
  };

  useEffect(() => {
    const videoElement = cameraPictureInPictureRef.current;
    const cameraTrack = tracks?.[1];

    if (!videoElement || !cameraTrack?.getMediaStreamTrack) return undefined;

    const cameraStream = new MediaStream([cameraTrack.getMediaStreamTrack()]);
    videoElement.srcObject = cameraStream;
    videoElement.play().catch(() => {
      // The Share Screen click will retry playback with a user gesture.
    });

    const handlePictureInPictureEnter = () => setIsCameraPictureInPicture(true);
    const handlePictureInPictureLeave = () => setIsCameraPictureInPicture(false);
    const handleWebkitPresentationChange = () => {
      setIsCameraPictureInPicture(videoElement.webkitPresentationMode === 'picture-in-picture');
    };

    videoElement.addEventListener('enterpictureinpicture', handlePictureInPictureEnter);
    videoElement.addEventListener('leavepictureinpicture', handlePictureInPictureLeave);
    videoElement.addEventListener('webkitpresentationmodechanged', handleWebkitPresentationChange);

    return () => {
      videoElement.removeEventListener('enterpictureinpicture', handlePictureInPictureEnter);
      videoElement.removeEventListener('leavepictureinpicture', handlePictureInPictureLeave);
      videoElement.removeEventListener('webkitpresentationmodechanged', handleWebkitPresentationChange);
      if (videoElement.srcObject === cameraStream) {
        videoElement.srcObject = null;
      }
    };
  }, [tracks]);

  const openCameraPictureInPicture = useCallback(async () => {
    const videoElement = cameraPictureInPictureRef.current;

    if (!videoElement || isVideoMuted) return false;

    try {
      if (videoElement.paused) {
        await videoElement.play();
      }

      if (document.pictureInPictureEnabled && videoElement.requestPictureInPicture) {
        if (document.pictureInPictureElement !== videoElement) {
          await videoElement.requestPictureInPicture();
        }
        return true;
      }

      if (
        videoElement.webkitSupportsPresentationMode &&
        videoElement.webkitSetPresentationMode
      ) {
        videoElement.webkitSetPresentationMode('picture-in-picture');
        return true;
      }
    } catch (pictureInPictureError) {
      console.info('Camera Picture-in-Picture is unavailable:', pictureInPictureError);
    }

    return false;
  }, [isVideoMuted]);

  const closeCameraPictureInPicture = useCallback(async () => {
    const videoElement = cameraPictureInPictureRef.current;

    try {
      if (document.pictureInPictureElement === videoElement) {
        await document.exitPictureInPicture();
      } else if (
        videoElement?.webkitPresentationMode === 'picture-in-picture' &&
        videoElement.webkitSetPresentationMode
      ) {
        videoElement.webkitSetPresentationMode('inline');
      }
    } catch (pictureInPictureError) {
      console.info('Could not close camera Picture-in-Picture:', pictureInPictureError);
    }
  }, []);

  useEffect(() => {
    if (wasScreenSharingRef.current && !isScreenSharing) {
      closeCameraPictureInPicture();
    }
    wasScreenSharingRef.current = isScreenSharing;
  }, [closeCameraPictureInPicture, isScreenSharing]);

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      const pictureInPictureOpened = await openCameraPictureInPicture();
      const screenShareStarted = await startScreenShare();

      if (!screenShareStarted && pictureInPictureOpened) {
        await closeCameraPictureInPicture();
      }
    } else {
      await stopScreenShare();
      await closeCameraPictureInPicture();
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
    // Check if device is mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // If mobile, try to switch to landscape orientation
    if (isMobile) {
      try {
        if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
          window.screen.orientation.lock('landscape').catch(err => {
            console.log('Could not lock screen to landscape:', err);
          });
        }
      } catch (error) {
        console.log('Orientation API not supported:', error);
      }
    }
    
    // Function to handle user published events
    const handleUserPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        
        if (mediaType === "video") {
          const videoTrack = user.videoTrack;
          
          // Screen shares use their own Agora UID so the presenter's camera stays published.
          if (videoTrack && isScreenShareUid(user.uid)) {
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
        if (isScreenShareUid(user.uid)) {
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
      if (isScreenShareUid(user.uid)) {
        setRemoteScreenTrack(null);
        setRemoteScreenUser(null);
        return;
      }
      setUsers((prevUsers) => prevUsers.filter((User) => User.uid !== user.uid));
    };

    const handleVolumeIndicator = (volumes) => {
      const loudestSpeaker = volumes
        .filter(volume => volume.level > 5)
        .sort((a, b) => b.level - a.level)[0];

      if (loudestSpeaker) {
        setActiveSpeakerUid(getUidString(loudestSpeaker.uid));
      }
    };

    const init = async () => {
      try {
        // Check if client is already connected or connecting
        if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
          console.log("Client already connected or connecting, skipping join");
          return;
        }

        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-left", handleUserLeft);
        client.on("volume-indicator", handleVolumeIndicator);

        // Add more detailed logging
        console.log("Joining channel with config:", {
          appId: config.appId,
          channelName: sessionId,
          uid: isTeacher ? 'teacher' : `${user.name}___${user.id}_${Math.floor(Math.random() * 1000000)}`,
          connectionState: client.connectionState
        });

        // Generate a unique ID for the user
        const uid = isTeacher ? 'teacher' : `${user.name}___${user.id}_${Math.floor(Math.random() * 1000000)}`;

        // Join channel with the unique ID
        await client.join(config.appId, sessionId, null, uid);
        console.log("Successfully joined channel");

        try {
          if (client.setLowStreamParameter) {
            client.setLowStreamParameter({
              width: 160,
              height: 90,
              framerate: 15,
              bitrate: 80
            });
          }

          if (client.enableDualStream) {
            await client.enableDualStream();
          }

          if (client.enableAudioVolumeIndicator) {
            client.enableAudioVolumeIndicator();
          }
        } catch (streamOptimizationError) {
          console.warn("Video room stream optimization is not available on this device:", streamOptimizationError);
        }

        if (tracks) {
          console.log("Publishing tracks:", tracks);
          await client.publish(tracks);
          setStart(true);
        }
      } catch (err) {
        console.error("Error setting up video room:", err);
        setError("Failed to join video room: " + (err.message || "Unknown error"));
      }
    };

    let initTimer;

    // Make sure tracks are ready before initializing
    if (ready && tracks) {
      console.log("Initializing with tracks:", tracks);
      // Use a single initialization attempt with a reasonable delay
      initTimer = setTimeout(() => {
        init();
      }, 500);
    }

    // Cleanup function
    return () => {
      try {
        if (initTimer) {
          clearTimeout(initTimer);
        }

        client.off("user-published", handleUserPublished);
        client.off("user-unpublished", handleUserUnpublished);
        client.off("user-left", handleUserLeft);
        client.off("volume-indicator", handleVolumeIndicator);

        if (tracks) {
          tracks.forEach(track => {
            if (track) {
              track.stop();
              track.close();
            }
          });
        }
        
        if (client.connectionState === 'CONNECTED') {
          if (tracks) {
            client.unpublish(tracks).then(() => {
              client.leave();
            }).catch(err => {
              console.error("Error during unpublish:", err);
              client.leave();
            });
          } else {
            client.leave();
          }
        }
      } catch (err) {
        console.error("Error during cleanup:", err);
      }
    };
  }, [sessionId, client, ready, tracks, isTeacher, user.name, user.id]);

  // Initialize socket connection
  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.REACT_APP_SOCKET_SERVER || 'http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    socketRef.current = socket;

    socket.emit('joinSession', {
      sessionId,
      userId: user.id,
      userName: user.name,
      isTeacher
    });

    // Event listeners
    socket.on('teacher-feedback', (data) => {
      console.log('Received feedback:', data);
      const { message } = data;
      showFeedbackMessage(message);
    });

    socket.on('handRaised', ({ userId, raised }) => {
      setRaisedHands(prev => {
        const newSet = new Set(prev);
        if (raised) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Whiteboard event listeners
    socket.on('whiteboardVisibilityChanged', ({ isVisible }) => {
      console.log('Whiteboard visibility changed:', isVisible);
      setShowWhiteboard(isVisible);
      if (isVisible) {
        socket.emit('joinWhiteboard', { sessionId });
      }
    });

    // Breakout room event listeners
    socket.on('breakoutRoomsCreated', (rooms) => {
      console.log('Breakout rooms created:', rooms);
      setBreakoutRooms(rooms);
    });

    socket.on('userJoinedBreakoutRoom', ({ userId, userName }) => {
      console.log(`${userName} joined the breakout room`);
    });

    socket.on('userLeftBreakoutRoom', ({ userId, userName }) => {
      console.log(`${userName} left the breakout room`);
    });

    socket.on('breakoutRoomBroadcast', ({ message }) => {
      console.log('Received broadcast message:', message);
      setBreakoutMessage(message);
      // Show message for 5 seconds
      setTimeout(() => setBreakoutMessage(''), 5000);
    });

    socket.on('breakoutRoomsEnded', () => {
      console.log('Breakout rooms ended');
      if (currentBreakoutRoom) {
        leaveBreakoutRoom();
      }
      setBreakoutRooms([]);
      setCurrentBreakoutRoom(null);
    });

    return () => {
      if (socket) {
        // Remove all listeners
        socket.off('teacher-feedback');
        socket.off('handRaised');
        socket.off('whiteboardVisibilityChanged');
        socket.off('breakoutRoomsCreated');
        socket.off('userJoinedBreakoutRoom');
        socket.off('userLeftBreakoutRoom');
        socket.off('breakoutRoomBroadcast');
        socket.off('breakoutRoomsEnded');
        socket.disconnect();
      }
    };
  }, [sessionId, user.id, user.name, isTeacher]);

  const handleFeedback = (message) => {
    console.log('Sending feedback:', message);
    if (socketRef.current) {
      const feedbackData = {
        sessionId,
        message,
        from: user.name
      };
      console.log('Emitting feedback:', feedbackData);
      socketRef.current.emit('teacher-feedback', feedbackData);
      showFeedbackMessage(message);
      setShowFeedbackPalette(false);
    }
  };

  const createBreakoutRooms = (numberOfRooms) => {
    if (!isTeacher) return;
    
    const rooms = Array.from({ length: numberOfRooms }, (_, index) => ({
      id: `room-${index + 1}`,
      name: `Room ${index + 1}`,
      participants: []
    }));

    socketRef.current.emit('createBreakoutRooms', {
      sessionId,
      rooms
    });
  };

  const joinBreakoutRoom = async (roomId) => {
    try {
      if (currentBreakoutRoom) {
        await leaveBreakoutRoom();
      }

      // Leave the main channel
      await client.leave();

      // Join the breakout room channel
      const breakoutChannelName = `${sessionId}_breakout_${roomId}`;
      await client.join(config.appId, breakoutChannelName, null, user.id);

      if (tracks) {
        await client.publish(tracks);
      }

      setCurrentBreakoutRoom(roomId);
      socketRef.current.emit('joinBreakoutRoom', {
        sessionId,
        roomId,
        userId: user.id,
        userName: user.name
      });

      console.log(`Joined breakout room: ${roomId}`);
    } catch (error) {
      console.error('Error joining breakout room:', error);
      setError('Failed to join breakout room');
    }
  };

  const leaveBreakoutRoom = async () => {
    try {
      if (!currentBreakoutRoom) return;

      // Leave the breakout room channel
      await client.leave();

      // Rejoin the main channel
      await client.join(config.appId, sessionId, null, user.id);

      if (tracks) {
        await client.publish(tracks);
      }

      socketRef.current.emit('leaveBreakoutRoom', {
        sessionId,
        roomId: currentBreakoutRoom,
        userId: user.id,
        userName: user.name
      });

      setCurrentBreakoutRoom(null);
      console.log('Left breakout room');
    } catch (error) {
      console.error('Error leaving breakout room:', error);
      setError('Failed to leave breakout room');
    }
  };

  const broadcastToBreakoutRooms = (message) => {
    if (!isTeacher || !message.trim()) return;
    console.log('Broadcasting message to breakout rooms:', message);
    socketRef.current.emit('broadcastToBreakoutRooms', {
      sessionId,
      message: message.trim()
    });
  };

  const endBreakoutRooms = () => {
    if (!isTeacher) return;
    console.log('Ending all breakout rooms');
    socketRef.current.emit('endBreakoutRooms', {
      sessionId
    });
  };

  const handleWhiteboardToggle = () => {
    const newVisibility = !showWhiteboard;
    setShowWhiteboard(newVisibility);

    if (socketRef.current) {
      // Emit whiteboard visibility change to all users
      socketRef.current.emit('toggleWhiteboard', {
        sessionId,
        isVisible: newVisibility
      });
    }
  };

  const toggleFullscreen = (elementId) => {
    const element = document.getElementById(elementId);
    
    if (!document.fullscreenElement) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const toggleHandRaise = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    
    if (socketRef.current) {
      socketRef.current.emit('toggleHand', {
        sessionId,
        userId: user.id,
        raised: newState
      });
    }
  };

  const handleRoomListDragStart = (e) => {
    if (e.target.closest('.room-button') || e.target.closest('.leave-room-button')) {
      return; // Don't start dragging if clicking buttons
    }
    setIsRoomListDragging(true);
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    roomListDragStart.current = {
      x: touch.clientX - roomListPosition.x,
      y: touch.clientY - roomListPosition.y
    };
  };

  const handleRoomListDrag = (e) => {
    if (!isRoomListDragging) return;
    e.preventDefault();
    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    
    // Calculate new position
    let newX = touch.clientX - roomListDragStart.current.x;
    let newY = touch.clientY - roomListDragStart.current.y;
    
    // Keep within window bounds
    newX = Math.max(0, Math.min(window.innerWidth - 240, newX));
    newY = Math.max(0, Math.min(window.innerHeight - 300, newY));
    
    setRoomListPosition({ x: newX, y: newY });
  };

  const handleRoomListDragEnd = () => {
    setIsRoomListDragging(false);
  };

  useEffect(() => {
    if (isRoomListDragging) {
      window.addEventListener('mousemove', handleRoomListDrag);
      window.addEventListener('mouseup', handleRoomListDragEnd);
      window.addEventListener('touchmove', handleRoomListDrag);
      window.addEventListener('touchend', handleRoomListDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleRoomListDrag);
        window.removeEventListener('mouseup', handleRoomListDragEnd);
        window.removeEventListener('touchmove', handleRoomListDrag);
        window.removeEventListener('touchend', handleRoomListDragEnd);
      };
    }
  }, [isRoomListDragging]);

  const handleRecording = async () => {
    if (!isRecording) {
      try {
        const tracks = [];
        
        // Add local tracks if they exist
        if (client.localTracks) {
          const videoTrack = client.localTracks[1]; // camera track
          const audioTrack = client.localTracks[0]; // microphone track
          
          if (videoTrack) {
            tracks.push(videoTrack.getMediaStreamTrack());
          }
          if (audioTrack) {
            tracks.push(audioTrack.getMediaStreamTrack());
          }
        }

        // Add remote users' tracks
        users.forEach(user => {
          if (user.videoTrack) {
            tracks.push(user.videoTrack.getMediaStreamTrack());
          }
          if (user.audioTrack) {
            tracks.push(user.audioTrack.getMediaStreamTrack());
          }
        });

        if (tracks.length === 0) {
          console.error('No tracks available for recording');
          return;
        }

        // Create a combined MediaStream
        const combinedStream = new MediaStream(tracks);
        recordingStreamRef.current = combinedStream;
        await startRecording(combinedStream);
        
        console.log('Recording started with', tracks.length, 'tracks');
      } catch (error) {
        console.error('Error in handleRecording:', error);
      }
    } else {
      stopRecording();
    }
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

  const FeedbackOverlay = ({ message, isVisible }) => {
    if (!isVisible) return null;
    
    return (
      <div className="feedback-overlay">
        <div className="feedback-message">
          {message}
        </div>
      </div>
    );
  };

  const feedbackMessages = [
    { text: "Excellent! 🌟", icon: <FaStar />, color: "#FFD700" },
    { text: "Well done! 👏", icon: <FaThumbsUp />, color: "#4CAF50" },
    { text: "Great point! 💡", icon: null, color: "#2196F3" },
    { text: "Keep going! 🚀", icon: null, color: "#9C27B0" },
    { text: "Almost there! 💪", icon: null, color: "#FF9800" },
    { text: "Try again! 🔄", icon: null, color: "#03A9F4" },
    { text: "Good effort! 👍", icon: null, color: "#8BC34A" },
    { text: "Nice try! 🎯", icon: null, color: "#FF5722" }
  ];

  const showFeedbackMessage = (message) => {
    // Clear any existing timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    setFeedbackMessage(message);
    setShowFeedback(true);

    // Hide the message after animation duration (2s)
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
      setFeedbackMessage("");
    }, 2000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("teacher-feedback", ({ message }) => {
        showFeedbackMessage(message);
      });

      return () => {
        socketRef.current.off("teacher-feedback");
      };
    }
  }, [socketRef]);

  // Detect if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
      console.log('Device detected as:', isMobile ? 'mobile' : 'desktop');
    };
    
    checkIfMobile();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      pronunciationAudioSourceRef.current?.stop();
      pronunciationAudioContextRef.current?.close();
    };
  }, []);

  // Prefer server-generated voices so mobile browsers do not use unreliable local TTS.
  const handlePronunciation = async (text) => {
    const pronunciationText = typeof text === 'string' ? text.trim() : '';
    if (!pronunciationText) return;

    let audioContext = pronunciationAudioContextRef.current;

    if (!audioContext && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContext = new AudioContext();
        pronunciationAudioContextRef.current = audioContext;
      }
    }

    // Calling resume directly from the tap keeps Android's audio permission active.
    const resumePromise = audioContext?.state === 'suspended'
      ? audioContext.resume()
      : Promise.resolve();

    try {
      await resumePromise;
      await handleApiPronunciation(audioContext, pronunciationText);
    } catch (error) {
      console.error('Server pronunciation failed:', error);
      if (!isMobileDevice) {
        handleBrowserPronunciationFallback(pronunciationText);
      } else {
        setPronunciationError('Pronunciation audio is unavailable. Please try again later.');
        setIsLoadingAudio(false);
      }
    }
  };

  const handleApiPronunciation = async (audioContext, pronunciationText) => {
    setIsLoadingAudio(true);
    setPronunciationError(null);

    const response = await axios.post('/api/pronounce', {
      text: pronunciationText,
      dialect: pronunciationDialect
    }, {
      responseType: 'arraybuffer',
      headers: { Accept: 'audio/mpeg' }
    });

    if (!response.data?.byteLength) {
      throw new Error('Pronunciation response did not include audio.');
    }

    if (audioContext) {
      const decodedAudio = await audioContext.decodeAudioData(response.data.slice(0));
      pronunciationAudioSourceRef.current?.stop();

      const source = audioContext.createBufferSource();
      source.buffer = decodedAudio;
      source.connect(audioContext.destination);
      source.onended = () => {
        if (pronunciationAudioSourceRef.current === source) {
          pronunciationAudioSourceRef.current = null;
          setIsLoadingAudio(false);
        }
      };
      pronunciationAudioSourceRef.current = source;
      source.start(0);
      return;
    }

    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    try {
      await audio.play();
      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = () => reject(new Error('Pronunciation audio could not be played.'));
      });
    } finally {
      URL.revokeObjectURL(audioUrl);
      setIsLoadingAudio(false);
    }
  };

  const handleBrowserPronunciationFallback = (pronunciationText) => {
    const hasSpeechSynthesis = typeof window !== 'undefined' && window.speechSynthesis;

    if (!hasSpeechSynthesis) {
      setPronunciationError('Pronunciation audio is unavailable. Please try again later.');
      setIsLoadingAudio(false);
      return;
    }

    setPronunciationError('Using desktop system voice because online pronunciation is unavailable.');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(pronunciationText);
    utterance.lang = pronunciationDialect;
    utterance.onend = () => setIsLoadingAudio(false);
    utterance.onerror = () => {
      setPronunciationError('Pronunciation audio is unavailable. Please try again later.');
      setIsLoadingAudio(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleDictionaryLookup = async () => {
    if (!dictionaryWord.trim()) return;
    
    setIsDictionaryLoading(true);
    setDictionaryError(null);
    setDictionaryResult(null);
    
    try {
      const response = await axios.post('/api/dictionary', { 
        word: dictionaryWord,
        language: dictionaryLanguage 
      });
      setDictionaryResult(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setDictionaryError('Word not found in dictionary. Please check the spelling.');
      } else {
        setDictionaryError('Failed to get definition. Please try again.');
      }
      console.error('Dictionary error:', err);
    } finally {
      setIsDictionaryLoading(false);
    }
  };

  const toggleDictionaryTool = () => {
    setShowDictionary(previous => !previous);
    setShowFeedbackPalette(false);
  };

  const toggleFeedbackPalette = () => {
    setShowFeedbackPalette(previous => !previous);
    setShowDictionary(false);
  };

  const teacherUser = useMemo(
    () => users.find(u => u.uid === 'teacher'),
    [users]
  );
  const studentUsers = useMemo(
    () => users.filter(u => u.uid !== 'teacher'),
    [users]
  );
  const remoteScreenPresenter = useMemo(() => {
    const ownerId = getScreenShareOwnerId(remoteScreenUser?.uid);
    if (!ownerId) return null;

    return users.find(remoteUser => (
      ownerId === 'teacher'
        ? getUidString(remoteUser.uid) === 'teacher'
        : getParticipantUserId(remoteUser.uid) === ownerId
    )) || null;
  }, [remoteScreenUser, users]);
  const screenShareCameraTrack = isScreenSharing
    ? tracks?.[1]
    : remoteScreenPresenter?.videoTrack;
  const screenShareCameraLabel = isScreenSharing
    ? `${user.name} (You)`
    : remoteScreenPresenter
      ? getParticipantName(remoteScreenPresenter.uid)
      : '';
  const showScreenShareCamera = Boolean(screenShareCameraTrack) && !(
    isScreenSharing && (isVideoMuted || isCameraPictureInPicture)
  );
  const isPhoneLandscapeLayout = viewportWidth <= 932 && viewportHeight <= 520 && viewportWidth > viewportHeight;
  const isMobileGalleryLayout = isMobileDevice || viewportWidth <= 768 || isPhoneLandscapeLayout;
  const participantPageSize = isMobileGalleryLayout
    ? MOBILE_PARTICIPANTS_PER_PAGE
    : DESKTOP_PARTICIPANTS_PER_PAGE;
  const pinnedParticipant = useMemo(
    () => pinnedParticipantUid
      ? studentUsers.find(remoteUser => getUidString(remoteUser.uid) === pinnedParticipantUid)
      : null,
    [pinnedParticipantUid, studentUsers]
  );
  const activeSpeakerUser = useMemo(
    () => activeSpeakerUid
      ? studentUsers.find(remoteUser => getUidString(remoteUser.uid) === activeSpeakerUid)
      : null,
    [activeSpeakerUid, studentUsers]
  );
  const spotlightParticipant = pinnedParticipant || activeSpeakerUser || null;
  const pageableStudentUsers = useMemo(
    () => spotlightParticipant
      ? studentUsers.filter(remoteUser => getUidString(remoteUser.uid) !== getUidString(spotlightParticipant.uid))
      : studentUsers,
    [spotlightParticipant, studentUsers]
  );
  const totalParticipantPages = Math.max(1, Math.ceil(pageableStudentUsers.length / participantPageSize));
  const currentParticipantPage = Math.min(participantPage, totalParticipantPages - 1);
  const visibleStudentUsers = useMemo(
    () => pageableStudentUsers.slice(
      currentParticipantPage * participantPageSize,
      currentParticipantPage * participantPageSize + participantPageSize
    ),
    [currentParticipantPage, pageableStudentUsers, participantPageSize]
  );
  const displayedStudentCount = studentUsers.length + (!isTeacher && start && tracks ? 1 : 0);
  const remainingCapacity = Math.max(0, MAX_VIDEO_ROOM_STUDENTS - displayedStudentCount);
  const dictionaryPronunciationText = dictionaryLanguage === 'id'
    ? dictionaryResult?.meanings?.[0]?.definitions?.[0]?.definition || ''
    : dictionaryResult?.word || dictionaryWord;

  useEffect(() => {
    if (participantPage > totalParticipantPages - 1) {
      setParticipantPage(totalParticipantPages - 1);
    }
  }, [participantPage, totalParticipantPages]);

  useEffect(() => {
    if (
      pinnedParticipantUid &&
      !studentUsers.some(remoteUser => getUidString(remoteUser.uid) === pinnedParticipantUid)
    ) {
      setPinnedParticipantUid(null);
    }
  }, [pinnedParticipantUid, studentUsers]);

  useEffect(() => {
    const highPriorityUids = new Set([
      teacherUser?.uid,
      spotlightParticipant?.uid,
      ...visibleStudentUsers.map(remoteUser => remoteUser.uid)
    ].filter(Boolean).map(getUidString));

    users.forEach(remoteUser => {
      if (!remoteUser.videoTrack || !client.setRemoteVideoStreamType) return;

      const streamType = highPriorityUids.has(getUidString(remoteUser.uid))
        ? REMOTE_STREAM_HIGH
        : REMOTE_STREAM_LOW;

      client.setRemoteVideoStreamType(remoteUser.uid, streamType).catch(err => {
        console.debug('Unable to adjust remote video stream quality:', err);
      });
    });
  }, [client, users, teacherUser, spotlightParticipant, visibleStudentUsers]);

  const renderRemoteVideoTile = (remoteUser, options = {}) => {
    const {
      compact = false,
      showPin = true,
      labelSuffix = '',
      idPrefix = 'student-video'
    } = options;
    const displayName = getParticipantName(remoteUser.uid);
    const videoId = getVideoElementId(idPrefix, remoteUser.uid);
    const userId = getParticipantUserId(remoteUser.uid);
    const hasRaisedHand = raisedHands.has(userId);
    const isPinned = pinnedParticipantUid === getUidString(remoteUser.uid);
    const isActive = activeSpeakerUid === getUidString(remoteUser.uid);

    return (
      <div
        key={`${idPrefix}-${remoteUser.uid}`}
        className={`participant-tile ${compact ? 'compact' : ''} ${isActive ? 'active-speaker' : ''}`}
        id={videoId}
      >
        <div className="absolute inset-0">
          {remoteUser.videoTrack ? (
            <AgoraVideoPlayer
              videoTrack={remoteUser.videoTrack}
              style={{ height: '100%', width: '100%' }}
            />
          ) : (
            <div className="participant-placeholder">
              <span>{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="participant-name">
          {displayName}{labelSuffix}
        </div>
        <div className="participant-actions">
          {showPin && (
            <button
              onClick={() => setPinnedParticipantUid(isPinned ? null : getUidString(remoteUser.uid))}
              className={`participant-action-button ${isPinned ? 'active' : ''}`}
              title={isPinned ? 'Unpin participant' : 'Pin participant'}
            >
              <FaThumbtack size={14} />
            </button>
          )}
          <button
            onClick={() => toggleFullscreen(videoId)}
            className="participant-action-button"
            title="Fullscreen"
          >
            <FaExpand size={14} />
          </button>
        </div>
        {hasRaisedHand && (
          <div className="hand-raised-badge">
            <FaHandPaper className="inline" />
            <span className="hidden sm:inline">Hand Raised</span>
          </div>
        )}
        {isActive && (
          <div className="active-speaker-badge">Speaking</div>
        )}
      </div>
    );
  };

  const renderTeacherGalleryTile = () => {
    const teacherTrack = isTeacher && start && tracks ? tracks[1] : teacherUser?.videoTrack;
    const teacherLabel = isTeacher ? `${user.name} (Teacher)` : 'Teacher';

    return (
      <div className="participant-tile mobile-teacher-tile" id="mobile-teacher-video">
        <div className="absolute inset-0">
          {teacherTrack ? (
            <AgoraVideoPlayer
              videoTrack={teacherTrack}
              style={{ height: '100%', width: '100%' }}
            />
          ) : (
            <div className="participant-placeholder">
              <span>T</span>
            </div>
          )}
        </div>
        <div className="participant-name">
          {teacherLabel}
        </div>
        <div className="teacher-corner-badge">Teacher</div>
      </div>
    );
  };

  const renderLocalGalleryTile = () => {
    if (isTeacher || !start || !tracks) return null;

    return (
      <div className="participant-tile local-tile" id="mobile-local-video">
        <div className="absolute inset-0">
          <AgoraVideoPlayer
            videoTrack={tracks[1]}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
        <div className="participant-name">
          {user.name} (You)
        </div>
      </div>
    );
  };

  const goToPreviousParticipantPage = () => {
    setParticipantPage(prev => Math.max(0, prev - 1));
  };

  const goToNextParticipantPage = () => {
    setParticipantPage(prev => Math.min(totalParticipantPages - 1, prev + 1));
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

  return (
    <div className={`relative w-full h-full bg-gray-900 video-room-container${isMobileGalleryLayout ? ' mobile-gallery-layout' : ''}`}>
      {tracks?.[1] && (
        <video
          ref={cameraPictureInPictureRef}
          className="screen-share-camera-pip-source"
          autoPlay
          muted
          playsInline
          aria-hidden="true"
        />
      )}

      {/* Error display */}
      <ErrorDisplay error={error || screenShareError} />
      
      {/* Whiteboard Overlay */}
      {showWhiteboard && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="relative h-full max-w-6xl mx-auto">
            <button
              onClick={() => setShowWhiteboard(false)}
              className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 z-10 transition-colors duration-200"
            >
              <FaTimesCircle size={24} />
            </button>
            <div className="h-full p-4">
              <Whiteboard 
                sessionId={sessionId} 
                className="bg-opacity-50"
                inVideoRoom={true}
              />
            </div>
          </div>
        </div>
      )}
      
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
            {showScreenShareCamera && (
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
                    videoTrack={screenShareCameraTrack}
                    style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                  />
                  {screenShareCameraLabel && (
                    <div className="participant-name">{screenShareCameraLabel}</div>
                  )}
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

      {isMobileGalleryLayout ? (
        <div className="mobile-zoom-room">
          <div className="room-header mobile-room-header">
            <div className="room-header-identity">
              <span className="room-live-indicator" aria-hidden="true" />
              <div className="room-header-copy">
                <h1>{session?.title || 'Live Classroom'}</h1>
                <p>{session?.subject || (isTeacher ? 'Teacher room' : 'Student room')}</p>
              </div>
            </div>
            <div className="room-header-actions">
              <span className="room-header-badge participant-count-badge">
                <FaUsers aria-hidden="true" />
                {displayedStudentCount}/{MAX_VIDEO_ROOM_STUDENTS}
              </span>
              <div className="participant-page-controls">
                <button
                  onClick={goToPreviousParticipantPage}
                  disabled={currentParticipantPage === 0}
                  title="Previous participants"
                  aria-label="Previous participant page"
                >
                  <FaChevronLeft />
                </button>
                <span>{currentParticipantPage + 1}/{totalParticipantPages}</span>
                <button
                  onClick={goToNextParticipantPage}
                  disabled={currentParticipantPage >= totalParticipantPages - 1}
                  title="Next participants"
                  aria-label="Next participant page"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>

          <div className="mobile-zoom-gallery">
            {renderTeacherGalleryTile()}
            {renderLocalGalleryTile()}
            {visibleStudentUsers.map(remoteUser => renderRemoteVideoTile(remoteUser, { compact: true }))}
          </div>
        </div>
      ) : (
      <div className="video-room-layout">
        <div className="room-header desktop-room-header">
          <div className="room-header-identity">
            <span className="room-live-indicator" aria-hidden="true" />
            <div className="room-header-copy">
              <div className="room-header-title-row">
                <h1>{session?.title || 'Live Classroom'}</h1>
                <span className="room-live-label">Live</span>
              </div>
              <p>
                {session?.subject || 'Online class'}
                <span aria-hidden="true"> · </span>
                {isTeacher ? 'Teacher view' : 'Student view'}
              </p>
            </div>
          </div>

          <div className="room-header-actions">
            <span className="room-header-badge connection-badge">
              <span className="connection-dot" aria-hidden="true" />
              {start ? 'Connected' : 'Connecting'}
            </span>
            <span className="room-header-badge participant-count-badge">
              <FaUsers aria-hidden="true" />
              {displayedStudentCount}/{MAX_VIDEO_ROOM_STUDENTS} students
            </span>
            <span className="room-header-badge seats-badge">{remainingCapacity} seats open</span>
            {qualityStats.sendBitrate ? (
              <span className="room-header-badge bitrate-badge">
                {Math.round(qualityStats.sendBitrate)} kbps
              </span>
            ) : null}
          </div>
        </div>

        <div className="teacher-stage">
          <div className="teacher-video-card">
            {isTeacher && start && tracks ? (
              <div className="relative aspect-video" id="teacher-video">
                <div className="absolute inset-0">
                  <AgoraVideoPlayer
                    videoTrack={tracks[1]}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <div className="participant-name">
                  {user.name} (Teacher)
                </div>
                <button
                  onClick={() => toggleFullscreen('teacher-video')}
                  className="teacher-fullscreen-button"
                  title="Fullscreen"
                >
                  <FaExpand size={16} />
                </button>
              </div>
            ) : teacherUser?.videoTrack ? (
              <div className="relative aspect-video" id="teacher-video">
                <div className="absolute inset-0">
                  <AgoraVideoPlayer
                    videoTrack={teacherUser.videoTrack}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <div className="participant-name">
                  Teacher
                </div>
                <button
                  onClick={() => toggleFullscreen('teacher-video')}
                  className="teacher-fullscreen-button"
                  title="Fullscreen"
                >
                  <FaExpand size={16} />
                </button>
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gray-100">
                <p className="text-gray-500 text-sm">Teacher video not available</p>
              </div>
            )}
          </div>

          {spotlightParticipant && (
            <div className="spotlight-card">
              <div className="spotlight-header">
                <span>{pinnedParticipant ? 'Pinned participant' : 'Active speaker'}</span>
                {pinnedParticipant && (
                  <button onClick={() => setPinnedParticipantUid(null)}>
                    Unpin
                  </button>
                )}
              </div>
              {renderRemoteVideoTile(spotlightParticipant, {
                compact: true,
                showPin: true,
                idPrefix: 'spotlight-video'
              })}
            </div>
          )}

          {session && (
            <div className="session-details">
              <h2 className="text-xl font-semibold mb-4">{session.title}</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 md:w-32 text-sm md:text-base">Subject:</span>
                  <span className="text-gray-900 text-sm md:text-base">{session.subject}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 md:w-32 text-sm md:text-base">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs md:text-sm ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
                {session.startedAt && (
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 md:w-32 text-sm md:text-base">Started:</span>
                    <span className="text-gray-900 text-sm md:text-base">
                      {new Date(session.startedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 md:w-32 text-sm md:text-base">Duration:</span>
                  <span className="text-gray-900 text-sm md:text-base">{session.duration} minutes</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 md:w-32 text-sm md:text-base">Grace Period:</span>
                  <span className="text-gray-900 text-sm md:text-base">{session.gracePeriod} minutes</span>
                </div>
                {session.description && (
                  <div className="mt-4">
                    <span className="text-gray-600 block mb-2 text-sm md:text-base">Description:</span>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded text-sm md:text-base">
                      {session.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="participant-panel">
          <div className="participant-panel-header">
            <div>
              <h3>Participants ({displayedStudentCount})</h3>
              <p>Page {currentParticipantPage + 1} of {totalParticipantPages}</p>
            </div>
            <div className="participant-page-controls">
              <button
                onClick={goToPreviousParticipantPage}
                disabled={currentParticipantPage === 0}
                title="Previous participants"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={goToNextParticipantPage}
                disabled={currentParticipantPage >= totalParticipantPages - 1}
                title="Next participants"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className="participant-grid">
            {!isTeacher && start && tracks && (
              <div className="participant-tile local-tile">
                <div className="absolute inset-0">
                  <AgoraVideoPlayer
                    videoTrack={tracks[1]}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <div className="participant-name">
                  {user.name} (You)
                </div>
              </div>
            )}

            {visibleStudentUsers.map(remoteUser => renderRemoteVideoTile(remoteUser, { compact: true }))}

            {visibleStudentUsers.length === 0 && (
              <div className="empty-participant-state">
                No student videos on this page yet.
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Meeting controls */}
      <div className="meeting-controls-shell">
        <div className="meeting-controls" role="toolbar" aria-label="Meeting controls">
          <button
            type="button"
            onClick={toggleAudio}
            className={`meeting-control ${isAudioMuted ? 'is-danger' : ''}`}
            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={isAudioMuted}
          >
            <span className="meeting-control-icon">
              {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </span>
            <span className="meeting-control-label">{isAudioMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            type="button"
            onClick={toggleVideo}
            className={`meeting-control ${isVideoMuted ? 'is-danger' : ''}`}
            title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
            aria-label={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
            aria-pressed={isVideoMuted}
          >
            <span className="meeting-control-icon">
              {isVideoMuted ? <FaVideoSlash /> : <FaVideo />}
            </span>
            <span className="meeting-control-label">{isVideoMuted ? 'Start video' : 'Stop video'}</span>
          </button>

          <span className="meeting-controls-divider" aria-hidden="true" />

          <button
            type="button"
            onClick={toggleScreenShare}
            className={`meeting-control ${isScreenSharing ? 'is-active' : ''}`}
            disabled={!ready}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            aria-pressed={isScreenSharing}
          >
            <span className="meeting-control-icon"><FaDesktop /></span>
            <span className="meeting-control-label">{isScreenSharing ? 'Stop share' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={handleWhiteboardToggle}
            className={`meeting-control ${showWhiteboard ? 'is-active' : ''}`}
            title={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
            aria-label={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
            aria-pressed={showWhiteboard}
          >
            <span className="meeting-control-icon"><FaEdit /></span>
            <span className="meeting-control-label">Whiteboard</span>
          </button>

          <span className="meeting-controls-divider" aria-hidden="true" />

          <button
            type="button"
            onClick={toggleDictionaryTool}
            className={`meeting-control ${showDictionary ? 'is-active' : ''}`}
            title="Dictionary and pronunciation"
            aria-label="Dictionary and pronunciation"
            aria-pressed={showDictionary}
          >
            <span className="meeting-control-icon"><FaBook /></span>
            <span className="meeting-control-label">Words</span>
          </button>

          {isTeacher && (
            <button
              type="button"
              onClick={toggleFeedbackPalette}
              className={`meeting-control ${showFeedbackPalette ? 'is-active' : ''}`}
              title="Quick feedback"
              aria-label="Quick feedback"
              aria-pressed={showFeedbackPalette}
            >
              <span className="meeting-control-icon"><FaComments /></span>
              <span className="meeting-control-label">Feedback</span>
            </button>
          )}

          <span className="meeting-controls-divider" aria-hidden="true" />

          <button
            type="button"
            onClick={toggleHandRaise}
            className={`meeting-control ${isHandRaised ? 'is-warning' : ''}`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
            aria-label={isHandRaised ? 'Lower hand' : 'Raise hand'}
            aria-pressed={isHandRaised}
          >
            <span className="meeting-control-icon">
              <FaHandPaper className={isHandRaised ? 'animate-pulse' : ''} />
            </span>
            <span className="meeting-control-label">{isHandRaised ? 'Lower hand' : 'Raise hand'}</span>
          </button>

          <button
            type="button"
            onClick={handleRecording}
            className={`meeting-control ${isRecording ? 'is-danger recording' : ''}`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            aria-pressed={isRecording}
          >
            <span className="meeting-control-icon">
              {isRecording ? <FaStop /> : <FaCircle className="recording-dot" />}
            </span>
            <span className="meeting-control-label">{isRecording ? 'Stop record' : 'Record'}</span>
          </button>
        </div>
      </div>

      {/* Breakout Room Controls */}
      {isTeacher && (
        <div className="breakout-controls">
          <button
            onClick={() => createBreakoutRooms(4)}
            className="control-button"
            title="Create Breakout Rooms"
          >
            <FaUsers />
          </button>
          {breakoutRooms.length > 0 && (
            <>
              <input
                type="text"
                value={breakoutMessage}
                onChange={(e) => setBreakoutMessage(e.target.value)}
                placeholder="Broadcast message..."
                className="broadcast-input"
              />
              <button
                onClick={() => broadcastToBreakoutRooms(breakoutMessage)}
                className="control-button"
                title="Broadcast to Rooms"
              >
                <FaComments />
              </button>
              <button
                onClick={endBreakoutRooms}
                className="control-button"
                title="End Breakout Rooms"
              >
                <FaTimesCircle />
              </button>
            </>
          )}
        </div>
      )}

      {/* Breakout Room List */}
      {breakoutRooms.length > 0 && !isTeacher && (
        <div 
          className={`breakout-rooms-list ${isRoomListCollapsed ? 'collapsed' : ''}`}
          style={{ 
            transform: `translate(${roomListPosition.x}px, ${roomListPosition.y}px)`,
            transition: isRoomListDragging ? 'none' : 'transform 0.3s ease'
          }}
        >
          <div 
            className="breakout-rooms-header"
            onMouseDown={handleRoomListDragStart}
            onTouchStart={handleRoomListDragStart}
          >
            <FaGripVertical className="drag-handle" />
            <h3>Breakout Rooms</h3>
            <button
              className="collapse-button"
              onClick={() => setIsRoomListCollapsed(!isRoomListCollapsed)}
            >
              {isRoomListCollapsed ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          
          <div className="breakout-rooms-content">
            {breakoutRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => joinBreakoutRoom(room.id)}
                className={`room-button ${currentBreakoutRoom === room.id ? 'active' : ''}`}
              >
                {room.name}
              </button>
            ))}
            {currentBreakoutRoom && (
              <button onClick={leaveBreakoutRoom} className="leave-room-button">
                Return to Main Room
              </button>
            )}
          </div>
        </div>
      )}

      {/* Broadcast Message Display */}
      {breakoutMessage && (
        <div className="broadcast-message">
          <p>{breakoutMessage}</p>
        </div>
      )}

      {/* Feedback Overlay */}
      <FeedbackOverlay message={feedbackMessage} isVisible={showFeedback} />

      {/* Teacher quick feedback */}
      {isTeacher && showFeedbackPalette && (
        <section className="feedback-popover" aria-label="Quick feedback options">
          <div className="feedback-popover-header">
            <div>
              <span>Teacher tool</span>
              <h2>Quick feedback</h2>
              <p>Send an encouraging message to everyone in the room.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowFeedbackPalette(false)}
              aria-label="Close quick feedback"
              title="Close"
            >
              <FaTimesCircle />
            </button>
          </div>
          <div className="feedback-option-grid">
            {feedbackMessages.map((feedback, index) => (
              <button
                type="button"
                key={index}
                className="feedback-option"
                onClick={() => handleFeedback(feedback.text)}
                title={feedback.text}
              >
                <span
                  className="feedback-option-swatch"
                  style={{ backgroundColor: feedback.color }}
                  aria-hidden="true"
                >
                  {feedback.icon}
                </span>
                <span>{feedback.text}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Learning tools */}
      <aside className={`learning-tools ${showDictionary ? 'expanded' : ''}`}>
        {showDictionary && (
          <section className="learning-tools-panel" aria-label="Dictionary tool panel">
            <div className="learning-tools-panel-header">
              <div>
                <span className="learning-tools-eyebrow">Learning tool</span>
                <h2>Dictionary</h2>
                <p>Look up, translate, and hear words in one place.</p>
              </div>
              <button
                type="button"
                className="learning-tools-close"
                onClick={() => setShowDictionary(false)}
                aria-label="Close dictionary tool"
                title="Close"
              >
                <FaTimesCircle />
              </button>
            </div>

            <div className="dictionary-content">
            <div className="dictionary-language-selector mb-2">
              <label className="learning-tools-field-label" htmlFor="dictionary-language">
                Language
              </label>
              <select
                id="dictionary-language"
                value={dictionaryLanguage}
                onChange={(e) => {
                  setDictionaryLanguage(e.target.value);
                  setDictionaryResult(null);
                  setDictionaryError(null);
                  setPronunciationError(null);
                }}
                className="dictionary-language-select"
              >
                <option value="en">English - English</option>
                <option value="id-en">English - Indonesian</option>
                <option value="id">Indonesian - English</option>
              </select>
            </div>
            <div className="dictionary-input-group">
              <input
                id="dictionary-word"
                type="text"
                value={dictionaryWord}
                onChange={(e) => {
                  setDictionaryWord(e.target.value);
                  setDictionaryResult(null);
                  setDictionaryError(null);
                  setPronunciationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && dictionaryWord.trim() && !isDictionaryLoading) {
                    handleDictionaryLookup();
                  }
                }}
                aria-label="Word to look up"
                placeholder={
                  dictionaryLanguage === 'id' 
                    ? 'Enter Indonesian word...' 
                    : dictionaryLanguage === 'id-en'
                    ? 'Enter English word...'
                    : 'Enter word to look up...'
                }
                className="dictionary-input"
              />
              <button
                type="button"
                onClick={handleDictionaryLookup}
                className="dictionary-button"
                disabled={!dictionaryWord.trim() || isDictionaryLoading}
                aria-label="Look up word"
              >
                {isDictionaryLoading ? '...' : <FaBook />}
              </button>
            </div>

            <div className="dictionary-pronunciation-section">
              <div className="dictionary-pronunciation-heading">
                <span>Pronunciation</span>
                <small>
                  {dictionaryLanguage === 'id' ? 'English translation' : 'English word'}
                </small>
              </div>
              <div className="dictionary-pronunciation-controls">
                <select
                  id="dictionary-pronunciation-dialect"
                  value={pronunciationDialect}
                  onChange={(e) => {
                    setPronunciationDialect(e.target.value);
                    setPronunciationError(null);
                  }}
                  className="voice-select"
                  aria-label="Pronunciation dialect"
                >
                  {PRONUNCIATION_DIALECTS.map(dialect => (
                    <option key={dialect.value} value={dialect.value}>
                      {dialect.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handlePronunciation(dictionaryPronunciationText)}
                  className="pronunciation-button"
                  disabled={!dictionaryPronunciationText.trim() || isLoadingAudio}
                  aria-label={`Play pronunciation for ${dictionaryPronunciationText || 'current word'}`}
                  title="Play pronunciation"
                >
                  {isLoadingAudio ? '...' : <FaVolumeUp />}
                </button>
              </div>
              {pronunciationError ? (
                <div className="pronunciation-status error">
                  <FaVolumeUp size={10} className="inline" />
                  <span>{pronunciationError}</span>
                </div>
              ) : (
                <div className="pronunciation-status">
                  <FaVolumeUp size={10} className="inline" />
                  <span>
                    {dictionaryLanguage === 'id' && !dictionaryResult
                      ? 'Look up the word first to hear its English translation.'
                      : 'Choose an accent, then play the pronunciation.'}
                  </span>
                </div>
              )}
            </div>
            
            {dictionaryError && (
              <div className="dictionary-error text-red-400 text-xs mt-2">
                {dictionaryError}
              </div>
            )}
            
            {dictionaryResult && (
              <div className="dictionary-result mt-3 p-3 bg-white/10 rounded-lg max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white">{dictionaryResult.word}</h4>
                  {dictionaryResult.phonetic && (
                    <span className="text-gray-300 text-sm">{dictionaryResult.phonetic}</span>
                  )}
                </div>
                
                {dictionaryResult.meanings && dictionaryResult.meanings.map((meaning, index) => (
                  <div key={index} className="mb-3">
                    <h5 className="font-semibold text-blue-300 capitalize text-sm mb-1">
                      {meaning.partOfSpeech}
                    </h5>
                    {meaning.definitions.map((def, defIndex) => (
                      <div key={defIndex} className="ml-2 mb-2">
                        <p className="text-gray-200 text-sm">
                          <span className="font-medium">{defIndex + 1}.</span> {def.definition}
                        </p>
                        {def.example && (
                          <p className="text-gray-400 text-xs italic mt-1">
                            "{def.example}"
                          </p>
                        )}
                        {def.synonyms && def.synonyms.length > 0 && (
                          <p className="text-gray-300 text-xs mt-1">
                            <span className="font-medium">Synonyms:</span> {def.synonyms.slice(0, 5).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
};

export default VideoRoom;
