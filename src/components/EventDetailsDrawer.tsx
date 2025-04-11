"use client";

import { FullCalendarEvent } from "@/presentation/Calendar";
import { useEffect, useCallback } from "react";

interface EventDetailsDrawerProps {
  event: FullCalendarEvent;
  onClose: () => void;
}

export default function EventDetailsDrawer({
  event,
  onClose,
}: EventDetailsDrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        <div className="w-screen max-w-md">
          <div className="flex h-full flex-col bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-700 px-4 py-6">
              <h2 className="text-lg font-medium text-white">{event.title}</h2>
              <button
                type="button"
                className="rounded-md text-gray-400 hover:text-gray-300"
                onClick={onClose}
              >
                <span className="sr-only">Close panel</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                {event.extendedProps.episode && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Episode
                    </h3>
                    <div className="mt-1 text-sm text-gray-300">
                      {event.extendedProps.episode}
                      {event.extendedProps.episodeName && (
                        <> - {event.extendedProps.episodeName}</>
                      )}
                    </div>
                  </div>
                )}

                {event.extendedProps.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Description
                    </h3>
                    <div className="mt-1 text-sm text-gray-300">
                      {event.extendedProps.description}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-400">Time</h3>
                  <div className="mt-1 text-sm text-gray-300">
                    {event.start && <>{event.start.toLocaleString()}</>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
