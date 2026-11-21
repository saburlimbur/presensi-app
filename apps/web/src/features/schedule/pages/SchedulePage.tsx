import { useState } from "react";
import Calendar from "@features/schedule/components/Calendar";
import CardShiftList from "@features/schedule/components/CardShifts";

const SchedulePage = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const selectedDay = Math.min(
    selectedDate,
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(),
  );

  return (
    <div className="space-y-3 mt-1 mb-6">
      <Calendar
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        selectedDate={selectedDay}
        setSelectedDate={setSelectedDate}
      />
      <CardShiftList currentDate={currentDate} selectedDate={selectedDay} />
    </div>
  );
};

export default SchedulePage;
