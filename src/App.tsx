import { LiveKitProvider } from "./context/LiveKitContext";
import ConferenceCall from "./components/conference/ConferenceCall";
import "primereact/resources/themes/lara-dark-indigo/theme.css";
import "primereact/resources/primereact.min.css";

function App() {
  return (
    <LiveKitProvider>
      <ConferenceCall />
    </LiveKitProvider>
  );
}

export default App;
