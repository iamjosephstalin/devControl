export interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  reminders?: {
    useDefault: boolean
  }
}

export interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
}

export async function fetchGoogleCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to fetch Google calendars")
  }

  const data = await response.json()
  return data.items || []
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleCalendarEvent
): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to create Google Calendar event")
  }

  return response.json()
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to update Google Calendar event")
  }

  return response.json()
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to delete Google Calendar event")
  }
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to fetch Google Calendar events")
  }

  const data = await response.json()
  return data.items || []
}

