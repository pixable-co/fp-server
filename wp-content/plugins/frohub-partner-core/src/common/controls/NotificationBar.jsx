import { Lightbulb } from 'lucide-react';

export default function NotificationBar({ message, className = '' }) {
    return (
        <div className={`flex items-end gap-2 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 mb-4 ${className}`}>
            <Lightbulb className="mt-1 h-5 w-5 text-gray-500" />
            <p>{message}</p>
        </div>
    );
}
