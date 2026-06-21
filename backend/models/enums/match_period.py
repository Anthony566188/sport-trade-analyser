from enum import Enum

class MatchPeriod(Enum):
    FIRST_HALF = "1H"
    HALF_TIME = "HT"
    SECOND_HALF = "2H"
    EXTRA_FIRST = "E1"
    EXTRA_SECOND = "E2"

# Dicionário que dita a ordem cronológica do futebol
PERIOD_ORDER = {
    MatchPeriod.FIRST_HALF: 1,
    MatchPeriod.HALF_TIME: 2,
    MatchPeriod.SECOND_HALF: 3,
    MatchPeriod.EXTRA_FIRST: 4,
    MatchPeriod.EXTRA_SECOND: 5
}