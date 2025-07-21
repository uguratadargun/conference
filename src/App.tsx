import { LiveKitProvider } from './context/LiveKitContext';
import RoomComponent from './components/RoomComponent';
import 'primereact/resources/themes/lara-dark-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import React, { useState, useEffect } from 'react';
import WelcomePage from './components/WelcomePage';
import PermissionPrompt from './components/PermissionPrompt';

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checkedPermission, setCheckedPermission] = useState(false);

  useEffect(() => {
    // Check camera and mic permissions
    async function checkPermissions() {
      try {
        const cam = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        const mic = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        if (cam.state === 'granted' && mic.state === 'granted') {
          setPermissionGranted(true);
        }
      } catch {}
      setCheckedPermission(true);
    }
    checkPermissions();
  }, []);

  if (!checkedPermission) return null;

  return (
    <LiveKitProvider>
      {!permissionGranted ? (
        <PermissionPrompt onGranted={() => setPermissionGranted(true)} />
      ) : username ? (
        <RoomComponent username={username} cameraOn={cameraOn} micOn={micOn} />
      ) : (
        <WelcomePage
          onJoin={(name: string, camera: boolean, mic: boolean) => {
            setUsername(name);
            setCameraOn(camera);
            setMicOn(mic);
          }}
        />
      )}
    </LiveKitProvider>
  );
}

export default App;
