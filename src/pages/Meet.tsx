import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Video, Share2, ArrowRight } from 'lucide-react';
import MeetInterface from '@/components/MeetInterface';
import { toast } from 'sonner';

// Generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Meet: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>('');

  useEffect(() => {
    // If roomId is provided in URL, use it; otherwise generate a new one
    if (roomId) {
      setCurrentRoomId(roomId);
    } else {
      const newRoomId = generateUUID();
      setCurrentRoomId(newRoomId);
      // Update URL without causing a page reload
      window.history.replaceState({}, '', `/meet/${newRoomId}`);
    }

    // Try to get username from localStorage
    const savedUserName = localStorage.getItem('userName');
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, [roomId]);

  const handleCreateNewRoom = () => {
    const newRoomId = generateUUID();
    navigate(`/meet/${newRoomId}`);
    toast.success('New meeting room created!');
  };

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!currentRoomId) {
      toast.error('Invalid room ID');
      return;
    }

    setIsJoining(true);
    
    // Save username to localStorage
    localStorage.setItem('userName', userName.trim());
    
    // Simulate joining delay
    setTimeout(() => {
      setHasJoined(true);
      setIsJoining(false);
      toast.success(`Joining room as ${userName.trim()}`);
    }, 1000);
  };

  const handleLeaveRoom = () => {
    setHasJoined(false);
    toast.info('Left the meeting room');
  };

  const handleShareRoom = () => {
    const roomLink = `${window.location.origin}/meet/${currentRoomId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my whiteboard meeting',
        text: 'Join me for a collaborative whiteboard session',
        url: roomLink,
      });
    } else {
      navigator.clipboard.writeText(roomLink);
      toast.success('Room link copied to clipboard!');
    }
  };

  // If user has joined, show the meeting interface
  if (hasJoined) {
    return (
      <MeetInterface
        roomId={currentRoomId}
        userName={userName}
        onLeave={handleLeaveRoom}
      />
    );
  }

  // Show join/create room interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Collaborative Whiteboard
          </h1>
          <p className="text-gray-600">
            Join or create a room to start collaborating
          </p>
        </div>

        {/* Join Room Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              {roomId ? 'Join Room' : 'Create New Room'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Room ID Display */}
            <div>
              <Label htmlFor="roomId">Room ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="roomId"
                  value={currentRoomId}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShareRoom}
                  title="Share room link"
                >
                  <Share2 size={16} />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this link with others to invite them
              </p>
            </div>

            {/* Username Input */}
            <div>
              <Label htmlFor="userName">Your Name</Label>
              <Input
                id="userName"
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                className="mt-1"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleJoinRoom}
                disabled={isJoining || !userName.trim()}
                className="w-full"
              >
                {isJoining ? (
                  'Joining...'
                ) : (
                  <>
                    {roomId ? 'Join Room' : 'Create & Join Room'}
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>

              {roomId && (
                <Button
                  variant="outline"
                  onClick={handleCreateNewRoom}
                  className="w-full"
                >
                  Create New Room Instead
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-green-100 p-2 rounded-full w-fit mx-auto mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <p className="font-medium">Real-time Collaboration</p>
                <p className="text-gray-500 text-xs">Work together in real-time</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 p-2 rounded-full w-fit mx-auto mb-2">
                  <Video className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-medium">Interactive Whiteboard</p>
                <p className="text-gray-500 text-xs">Draw, sketch, and annotate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Room links are unique and secure</p>
        </div>
      </div>
    </div>
  );
};

export default Meet;
