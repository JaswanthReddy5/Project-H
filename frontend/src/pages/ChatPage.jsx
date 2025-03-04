import { useParams } from "react-router-dom";

const ChatPage = () => {
  const { chatId } = useParams();
  
  return <div>Chat started for ID: {chatId}</div>;
};

export default ChatPage;
