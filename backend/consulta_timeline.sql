select t.id as ID_TIMELINE, t.MINUTE_STARTED, t.MINUTE_FINISHED, te.ID_CRITERION, te.EVENT, te.MINUTE, te.second, te.DESCRIPTION, te.team, c.title from
TIMELINES t join TIMELINE_EVENTS te
on t.id = te.ID_TIMELINE
left join CRITERIA c
on te.ID_CRITERION = c.id
order by te.MINUTE, te.SECOND asc