import { useMemo } from 'react';
import { parseBusinessHours } from '../utils/formatBusinessHours';

const BusinessHoursDisplay = ({ value, className = '' }) => {
  const schedules = useMemo(() => parseBusinessHours(value), [value]);

  if (!schedules.length) return null;

  const isFallback = schedules.length === 1 && !schedules[0].days;

  if (isFallback) {
    return (
      <div className={`timing-schedules timing-schedules--fallback ${className}`.trim()}>
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
