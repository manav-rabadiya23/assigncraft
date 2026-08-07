const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function MessageBanner({ message }) {
  if (!message?.text) return null;

  return (
    <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${styles[message.type] || styles.info}`}>
      {message.text}
    </div>
  );
}
