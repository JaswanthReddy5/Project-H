import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {Navbar} from "./Components/Navbar";
import ChatPage from "./pages/ChatPage";  // ✅ Corrected case-sensitive import

function App() {
  return (
    <Router>
      <Routes>
      
      <Route path="/" element={<Navbar />} />
      <Route path="/chat/:chatId" element={<ChatPage />} />
      </Routes>
      
    </Router>
  );
}

export default App;
