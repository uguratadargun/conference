import { LiveKitProvider } from "./context/LiveKitContext";
import RoomComponent from "./components/RoomComponent";
import "primereact/resources/themes/lara-dark-indigo/theme.css";
import "primereact/resources/primereact.min.css";

function App() {
  return (
    <LiveKitProvider>
      <RoomComponent />
    </LiveKitProvider>
  );
}

export default App;
