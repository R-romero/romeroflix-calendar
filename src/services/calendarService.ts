import ICAL from "ical.js";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  source?: string;
}

export class CalendarService {
  private jcalData: ICAL.Component;

  constructor() {
    this.jcalData = new ICAL.Component(["vcalendar", [], []]);
  }

  clearEvents() {
    this.jcalData = new ICAL.Component(["vcalendar", [], []]);
  }

  async importCalendarFromFeed(feedUrl: string): Promise<void> {
    try {
      const response = await fetch(
        `/api/calendar-proxy?url=${encodeURIComponent(feedUrl)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to fetch calendar feed: ${response.statusText}`
        );
      }

      const icalString = await response.text();

      if (!icalString || icalString.trim().length === 0) {
        throw new Error("Received empty calendar feed");
      }

      // Verify basic iCal format before parsing
      if (!icalString.includes("BEGIN:VCALENDAR")) {
        throw new Error("Invalid calendar format received");
      }

      // Determine the source based on the feed URL
      const source = feedUrl.includes("radarr")
        ? "radarr"
        : feedUrl.includes("sonarr")
        ? "sonarr"
        : "unknown";

      this.importCalendar(icalString, source);
    } catch (error) {
      console.error("Error importing calendar feed:", error);
      if (error instanceof Error) {
        throw new Error(`Calendar import failed: ${error.message}`);
      }
      throw error;
    }
  }

  private importCalendar(icalString: string, source: string): void {
    try {
      const jcalData = ICAL.parse(icalString);
      const comp = new ICAL.Component(jcalData);

      const vevents = comp.getAllSubcomponents("vevent");
      for (const vevent of vevents) {
        try {
          const dtstart = vevent.getFirstPropertyValue("dtstart") as ICAL.Time;

          if (!dtstart) {
            throw new Error("Event must have a valid start date");
          }

          // Add source information to the original vevent
          vevent.addPropertyWithValue("x-source", source);

          this.jcalData.addSubcomponent(vevent);
        } catch (eventError) {
          console.error("Error processing event:", eventError);
          // Continue processing other events
        }
      }
    } catch (error) {
      console.error("Error parsing calendar:", error);
      throw error;
    }
  }

  getEvents(): CalendarEvent[] {
    try {
      const events: CalendarEvent[] = [];
      const vevents = this.jcalData.getAllSubcomponents("vevent");

      for (const vevent of vevents) {
        try {
          const uid = vevent.getFirstPropertyValue("uid");
          const summary = vevent.getFirstPropertyValue("summary");
          const dtstart = vevent.getFirstPropertyValue("dtstart") as ICAL.Time;
          const dtend = vevent.getFirstPropertyValue("dtend") as ICAL.Time;
          const description = vevent.getFirstPropertyValue("description");
          const location = vevent.getFirstPropertyValue("location");
          const source = vevent.getFirstPropertyValue("x-source");

          if (!dtstart) {
            throw new Error("Event must have a valid start date");
          }

          const event: CalendarEvent = {
            id:
              typeof uid === "string"
                ? uid
                : `event-${Date.now()}-${Math.random()}`,
            title: typeof summary === "string" ? summary : "Untitled Event",
            start: dtstart.toJSDate(),
            end: dtend?.toJSDate() || dtstart.toJSDate(),
            description:
              typeof description === "string" ? description : undefined,
            location: typeof location === "string" ? location : undefined,
            source: typeof source === "string" ? source : undefined,
          };

          events.push(event);
        } catch (eventError) {
          console.error("Error processing event:", eventError);
          // Continue processing other events
        }
      }

      return events;
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }
}
