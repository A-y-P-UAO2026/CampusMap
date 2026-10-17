import { ArrowRight, CalendarDays, Clock, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EventWithLocation } from '@/services/events'
import {
  formatEventDate,
  formatEventTimeRange,
  getRegistrationState,
} from './eventFormat'

export function EventCard({ event }: { event: EventWithLocation }) {
  const registration = getRegistrationState(event)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <Badge variant={registration.open ? 'secondary' : 'outline'} className="w-fit">
          {registration.label}
        </Badge>
        <CardTitle className="pt-2 text-lg">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formatEventDate(event.starts_at)}
          </li>
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formatEventTimeRange(event.starts_at, event.ends_at)}
          </li>
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {event.location?.name ?? 'Lugar por confirmar'}
          </li>
          <li className="flex items-start gap-2">
            <Users className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Capacidad: {event.capacity} personas
          </li>
        </ul>
        <Button
          render={<Link to={`/eventos/${event.id}`} />}
          variant="outline"
          className="mt-5 min-h-11 w-full sm:w-auto sm:self-start"
        >
          Ver detalle <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}