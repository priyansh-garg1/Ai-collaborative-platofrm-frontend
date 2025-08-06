import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Users, Copy, Share2, Settings, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import WhiteboardCanvas from './WhiteboardCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  isCurrentUser: boolean;
  joinedAt: Date;
}

interface MeetInterfaceProps {
  roomId: string;
  userName: string;
  onLeave?: () => void;
}

const MeetInterface: React.FC<MeetInterfaceProps> = ({ roomId, userName, onLeave }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join the room
      newSocket.emit('join-room', { roomId, userName });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for user updates
    newSocket.on('room-users-updated', (users: User[]) => {
      setConnectedUsers(users);
    });

    // Listen for user joined
    newSocket.on('user-joined', (user: { name: string }) => {
      toast.success(`${user.name} joined the meeting`);
    });

    // Listen for user left
    newSocket.on('user-left', (user: { name: string }) => {
      toast.info(`${user.name} left the meeting`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, userName]);

  const handleCopyRoomLink = () => {
    const roomLink = `${window.location.origin}/meet/${roomId}`;
    navigator.clipboard.writeText(roomLink);
    toast.success('Room link copied to clipboard!');
  };

  const handleShareRoom = () => {
    const roomLink = `${window.location.origin}/meet/${roomId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my whiteboard meeting',
        text: 'Join me for a collaborative whiteboard session',
        url: roomLink,
      });
    } else {
      handleCopyRoomLink();
    }
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    // TODO: Implement actual microphone toggle
    toast.info(isMicOn ? 'Microphone turned off' : 'Microphone turned on');
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    // TODO: Implement actual video toggle
    toast.info(isVideoOn ? 'Video turned off' : 'Video turned on');
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave-room', { roomId, userName });
      socket.disconnect();
    }
    if (onLeave) {
      onLeave();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* User Panel */}
      {showUserPanel && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Meeting Room</h2>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Connecting..."}
              </Badge>
            </div>
            
            {/* Room Info */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Room ID</div>
              <div className="flex items-center gap-2">
                <Input
                  value={roomId}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyRoomLink}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShareRoom}
                className="w-full"
              >
                <Share2 size={16} className="mr-2" />
                Share Room Link
              </Button>
            </div>
          </div>

          {/* Connected Users */}
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} />
              <h3 className="font-medium">
                Participants ({connectedUsers.length})
              </h3>
            </div>
            
            <div className="space-y-2">
              {connectedUsers.map((user) => (
                <Card key={user.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {user.name}
                        {user.isCurrentUser && (
                          <span className="text-blue-600 ml-1">(You)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined {user.joinedAt ? new Date(user.joinedAt).toLocaleTimeString() : ""}
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </Card>
              ))}
              
              {connectedUsers.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Waiting for participants...</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="sm"
                variant={isMicOn ? "default" : "outline"}
                onClick={toggleMic}
              >
                {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
              </Button>
              <Button
                size="sm"
                variant={isVideoOn ? "default" : "outline"}
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUserPanel(false)}
              >
                <Settings size={16} />
              </Button>
            </div>
            
            <Button
              variant="destructive"
              onClick={handleLeave}
              className="w-full"
            >
              Leave Meeting
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showUserPanel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUserPanel(true)}
                >
                  <Users size={16} className="mr-2" />
                  Show Participants ({connectedUsers.length})
                </Button>
              )}
              <h1 className="text-xl font-semibold">
                Collaborative Whiteboard
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Room: {roomId.slice(0, 8)}...
              </Badge>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Whiteboard */}
        <div className="flex-1">
          <WhiteboardCanvas
            roomId={roomId}
            socket={socket}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default MeetInterface;
