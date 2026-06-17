select te.MINUTE_SECOND / 60 as MINUTE, te.MINUTE_SECOND % 60 as SECOND, te.ADDITIONAL_MINUTE_SECOND, te.EVENT, c.title AS CRITERION, b.ID as ID_BET, te.team from
MATCHES m join TIMELINES t 
on m.id = t.ID_MATCH
join TIMELINE_EVENTS te
on t.id = te.ID_TIMELINE
left join CRITERIA c
on te.ID_CRITERION = c.id
left join BETS b
on te.ID_BET = b.ID
where m.id = 16
order by te.MINUTE_SECOND asc;