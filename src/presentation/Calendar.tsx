"use client";

// #region Imports
import { useState, useCallback, useMemo } from "react";
import { CalendarService } from "@/services/calendarService";
import { calendarFeeds } from "@/config/calendarFeeds";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery } from "@tanstack/react-query";
import { CalendarEvent } from "@/services/calendarService";
import { EventClickArg } from "@fullcalendar/core";
import EventDetailsDrawer from "@/components/EventDetailsDrawer";
// #endregion

// #region Types
export type FullCalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  extendedProps: CalendarEvent & {
    episode?: string;
    episodeName?: string;
    originalTitle?: string;
  };
};
// #endregion

// #region Constants
const calendarService = new CalendarService();
// #endregion

// #region Helper Functions
const parseTitle = (title: string) => {
  if (title.includes("x")) {
    const match = title.match(/^(.*?)(?=\s*-\s*\d+x\d+)/);
    if (match) {
      return match[1].trim();
    }
  } else if (title.includes("(")) {
    return title.split("(")[0].trim();
  }
  return title;
};

const parseEpisodeDetails = (title: string) => {
  if (!title.includes("x")) return null;

  const parts = title.split(" - ");
  if (parts.length >= 3) {
    return {
      title: parts[0].trim(),
      episode: parts[1].trim(),
      episodeName: parts.slice(2).join(" - ").trim(),
    };
  }
  return null;
};
// #endregion

export default function Calendar() {
  // #region State
  const [selectedEvent, setSelectedEvent] = useState<FullCalendarEvent | null>(
    null
  );
  // #endregion

  // #region Event Handlers
  const handleEventClick = useCallback((info: EventClickArg) => {
    if (!info.event.start) return;

    setSelectedEvent({
      title: info.event.title,
      start: info.event.start,
      end: info.event.end || info.event.start,
      extendedProps: info.event.extendedProps as CalendarEvent & {
        episode?: string;
        episodeName?: string;
        originalTitle?: string;
      },
    });
  }, []);

  const handleCloseTooltip = useCallback(() => {
    setSelectedEvent(null);
  }, []);
  // #endregion

  // #region Data Fetching
  const {
    data: events = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: async () => {
      calendarService.clearEvents();
      for (const feed of calendarFeeds) {
        if (feed.enabled) {
          try {
            await calendarService.importCalendarFromFeed(feed.url);
          } catch (feedError) {
            console.error(`Failed to load ${feed.name}:`, feedError);
          }
        }
      }
      return calendarService.getEvents();
    },
    staleTime: 1000 * 60 * 30, // Consider data fresh for 30 minutes
  });

  const calendarEvents = useMemo(
    () =>
      events.map((event) => {
        const episodeDetails = parseEpisodeDetails(event.title);
        return {
          title: parseTitle(event.title),
          start: event.start,
          end: event.end,
          backgroundColor: "#374151",
          borderColor: "#8b5cf6",
          textColor: "#e5e7eb",
          classNames: ["font-medium", "text-sm", "hover:bg-gray-600"],
          extendedProps: {
            episode: episodeDetails?.episode || null,
            episodeName: episodeDetails?.episodeName || null,
            originalTitle: event.title,
            description: event.description,
            location: event.location,
          },
        };
      }),
    [events]
  );
  // #endregion

  // #region Loading States
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-xl text-gray-300">Loading calendar feeds...</div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-900/50 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
          <h2 className="font-bold">Error</h2>
          <p>Failed to load calendar feeds</p>
        </div>
      </div>
    );
  }
  // #endregion

  // #region Render
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Release Schedule</h1>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            eventContent={(eventInfo) => (
              <div className="p-1">
                <div className="font-medium truncate text-gray-100">
                  {eventInfo.event.title}
                </div>
                {eventInfo.event.extendedProps.episode && (
                  <div className="text-xs text-gray-400 truncate">
                    {eventInfo.event.extendedProps.episode}
                    {eventInfo.event.extendedProps.episodeName && (
                      <> - {eventInfo.event.extendedProps.episodeName}</>
                    )}
                  </div>
                )}
              </div>
            )}
            height="auto"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: false,
            }}
            eventDisplay="block"
            eventMinHeight={30}
            dayMaxEvents={true}
            moreLinkText="+%d more"
            moreLinkClick="popover"
            eventClassNames="hover:opacity-90 transition-opacity cursor-pointer"
            themeSystem="standard"
            dayCellClassNames="hover:bg-gray-700/50 transition-colors"
            dayHeaderClassNames="text-gray-300"
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
            buttonIcons={{
              prev: "chevron-left",
              next: "chevron-right",
            }}
          />
        </div>

        {selectedEvent && (
          <EventDetailsDrawer
            event={selectedEvent}
            onClose={handleCloseTooltip}
          />
        )}
      </div>
    </div>
  );
  // #endregion
}
