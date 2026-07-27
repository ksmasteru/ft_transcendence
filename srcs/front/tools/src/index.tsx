import "./index.css";
import { Views } from "./Views";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

const container = document.getElementById("root");

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="bg-primary-bg min-h-screen">
        <Views />
      </div>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(container!);
root.render(<App />);
