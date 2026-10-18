select proname from pg_proc
where proname in ('get_event_availability', 'get_my_event_status');