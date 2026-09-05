export function ProgressBar({ value, label = true }: { value: number; label?: boolean }) {
  return <div className="progress-wrap">{label && <div className="progress-label"><span>Progress</span><strong>{value}%</strong></div>}<div className="progress-track" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${value}%` }} /></div></div>;
}
