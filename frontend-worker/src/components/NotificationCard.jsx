export default function NotificationCard({ title, description, time }) {
  return (
    <div className="notification">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <span>{time}</span>
    </div>
  );
}
