export interface CalendarFeed {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export const calendarFeeds: CalendarFeed[] = [
  {
    id: "sonarr",
    name: "Sonarr TV Shows",
    url: process.env.NEXT_PUBLIC_SONARR_CALENDAR_URL || "",
    enabled: true,
  },
  {
    id: "radarr",
    name: "Radarr Movies",
    url: process.env.NEXT_PUBLIC_RADARR_CALENDAR_URL || "",
    enabled: true,
  },
];
