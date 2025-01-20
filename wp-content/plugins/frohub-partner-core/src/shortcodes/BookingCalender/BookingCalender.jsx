import FhCalender from "../../common/controls/FhCalender.jsx";

export default function BookingCalender() {
    const events = [
        {
            id: '1',
            title: 'Car Booking',
            start: '2025-01-10T10:00:00',
            end: '2025-01-10T11:30:00',
            customer: 'John Doe',
            email: 'hello@example.com',
            phone: '123-456-7890',
            service: 'Haircut',
        },
        {
            id: '2',
            title: 'Booking 2',
            start: '2025-01-15T14:00:00',
            end: '2025-01-15T15:00:00',
            customer: 'Jane Smith',
            email: 'hello@example.com',
            phone: '098-765-4321',
            service: 'Facial',
        }
    ];

    return (
        <div>
            <FhCalender type="day" events={events} />
        </div>
    );
}