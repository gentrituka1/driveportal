type StatusNoticeProps = {
  label?: string;
  value: string;
};

export default function StatusNotice({ label = "Status", value }: StatusNoticeProps) {
  return (
    <p className="status">
      <span className="font-medium">{label}: </span>
      <span>{value}</span>
    </p>
  );
}
