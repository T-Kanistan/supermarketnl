import { useMemo } from 'react';
import { parseBusinessHours } from '../utils/formatBusinessHours';
import './BusinessHoursDisplay.css';

const BusinessHoursDisplay = ({
  value,
  className = '',
  loading = false,
  emptyMessage = 'Opening hours not available.',
}) => {
  const schedules = useMemo(() => parseBusinessHours(value), [value]);

  if (loading) {
    return (
      <div className={`timing-schedules timing-schedules--loading ${className}`.trim()} aria-hidden="true">
        <span className="timing-skeleton-line" />
        <span className="timing-skeleton-line timing-skeleton-line--short" />
      </div>
    );
  }

  if (!schedules.length) {
    return <p className={`timing-unavailable ${className}`.trim()}>{emptyMessage}</p>;
  }

  const isPlainText = schedules.length === 1 && !schedules[0].days;

  if (isPlainText) {
    return (
      <div className={`timing-schedules timing-schedules--plain ${className}`.trim()}>
        <span className="timing-hours">{schedules[0].hours}</span>
      </div>
    );
  }

  return (
    <div className={`timing-schedules ${className}`.trim()}>
      {schedules.map((schedule, index) => (
        <div key={`${schedule.days}-${schedule.hours}-${index}`} className="timing-schedule">
          {schedule.days ? <span className="timing-days">{schedule.days}</span> : null}
          <span className="timing-hours">{schedule.hours}</span>
        </div>
      ))}
    </div>
  );
};

export default BusinessHoursDisplay;
