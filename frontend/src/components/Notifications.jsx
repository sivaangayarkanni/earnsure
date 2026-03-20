import { useNotification } from "../context/NotificationContext";

export default function Notifications() {
  const { notifications, removeNotification } = useNotification();

  if (!notifications.length) return null;

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      maxWidth: "360px",
    }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            padding: "14px 18px",
            borderRadius: "10px",
            background: n.type === "success" ? "#16a34a" :
                       n.type === "error" ? "#dc2626" :
                       n.type === "warning" ? "#d97706" : "#2563eb",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <span>{n.message}</span>
          <button
            onClick={() => removeNotification(n.id)}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
