export interface CharityEvent {
  id?: number;
  organisation_id: number;
  category_id: number;
  name: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  purpose: string;
  ticket_price: number;
  charity_goal: number;
  current_progress: number;
  is_suspended?: number;
}

export function isValidCharityEvent(event: CharityEvent): boolean {
  return Boolean(
    event.name.trim() && event.description.trim() && event.location.trim() && event.purpose.trim() &&
      /^\d{4}-\d{2}-\d{2}$/.test(event.event_date) && /^\d{2}:\d{2}/.test(event.event_time) &&
      event.ticket_price >= 0 && event.charity_goal > 0 && event.current_progress >= 0
  );
}
