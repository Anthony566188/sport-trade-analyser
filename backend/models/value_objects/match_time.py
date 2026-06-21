from dataclasses import dataclass
from functools import total_ordering
from typing import Optional

from models.enums.match_period import MatchPeriod, PERIOD_ORDER


@total_ordering
@dataclass(frozen=True)  # frozen=True garante que seja imutável, uma boa prática para Value Objects
class MatchTime:
    period: MatchPeriod
    minute: int
    additional_minute: int = 0

    # '__lt__' Implementa o operador: '<'
    def __lt__(self, other: 'MatchTime') -> bool:
        # Verifica se o outro objeto é MatchTime
        if not isinstance(other, MatchTime):
            return NotImplemented

        # 1. Compara os períodos primeiro
        weight_self = PERIOD_ORDER.get(self.period, 0)
        weight_other = PERIOD_ORDER.get(other.period, 0)

        if weight_self != weight_other:
            return weight_self < weight_other

        # 2. Se for o mesmo período, compara o minuto regular
        if self.minute != other.minute:
            return self.minute < other.minute

        # 3. Se for o mesmo minuto, compara o acréscimo
        return self.additional_minute < other.additional_minute

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, MatchTime):
            return NotImplemented

        return (self.period == other.period and
                self.minute == other.minute and
                self.additional_minute == other.additional_minute)