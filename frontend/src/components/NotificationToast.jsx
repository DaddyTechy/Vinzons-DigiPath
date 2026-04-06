import {
  HiOutlineDocumentArrowDown,
  HiOutlineDocumentArrowUp,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';

export default function NotificationToast({ notifications, onClose }) {
  if (!notifications.length) return null;

  const getNotifStyle = (type) => {
    switch (type) {
      case 'document_incoming': return { className: 'incoming', icon: <HiOutlineDocumentArrowDown />, title: 'Incoming Document' };
      case 'document_received': return { className: 'received', icon: <HiOutlineCheckCircle />, title: 'Document Received' };
      case 'document_created': return { className: 'created', icon: <HiOutlineDocumentArrowUp />, title: 'New Document' };
      default: return { className: 'created', icon: <HiOutlineDocumentArrowUp />, title: 'Notification' };
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notif) => {
        const style = getNotifStyle(notif.type);
        return (
          <div key={notif.id} className={`notification-toast ${style.className}`}>
            <div className="notif-icon">{style.icon}</div>
            <div className="notif-content">
              <h4>{style.title}</h4>
              <p>
                {notif.data?.subject && <span>{notif.data.subject}</span>}
                {notif.data?.tracking_number && <span> ({notif.data.tracking_number})</span>}
                {notif.data?.from_office && <span> from {notif.data.from_office}</span>}
                {notif.data?.office && <span> at {notif.data.office}</span>}
              </p>
            </div>
            <button className="notif-close" onClick={() => onClose(notif.id)}>
              <HiOutlineXCircle />
            </button>
          </div>
        );
      })}
    </div>
  );
}
