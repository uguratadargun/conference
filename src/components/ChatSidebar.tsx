import React from 'react';
import { Button } from 'primereact/button';
import { IconX, IconMessage } from '@tabler/icons-react';

interface ChatSidebarProps {
  visible: boolean;
  onHide: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ visible, onHide }) => {
  if (!visible) return null;

  return (
    <div className="chat-sidebar-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <div className="icon-circle">
              <IconMessage size={24} />
            </div>
            <h2 className="sidebar-title">Chat</h2>
            <Button className="close-sidebar-button" onClick={onHide}>
              <IconX size={20} />
            </Button>
          </div>
          {/* Chat Content Placeholder */}
          <div className="chat-section">
            <div className="chat-placeholder">
              Chat messages will appear here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
