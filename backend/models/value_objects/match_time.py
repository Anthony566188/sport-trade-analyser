from dataclasses import dataclass
from functools import total_ordering
from typing import Dict

from models.enums.match_period import MatchPeriod, PERIOD_ORDER


# CONSTANTE GLOBAL
# Define os limites usando os Enums oficiais como chave
PERIOD_LIMITS: Dict[MatchPeriod, int] = {
    MatchPeriod.FIRST_HALF: 2700,   # 45 min
    MatchPeriod.SECOND_HALF: 5400,  # 90 min
    MatchPeriod.EXTRA_FIRST: 6300,  # 105 min
    MatchPeriod.EXTRA_SECOND: 7200  # 120 min
}

# Dicionário derivado automático para validações textuais
# Resultado gerado: {'1H': 2700, '2H': 5400, 'E1': 6300, 'E2': 7200}
STR_PERIOD_LIMITS: Dict[str, int] = {period.value: limit for period, limit in PERIOD_LIMITS.items()}


def check_football_limits(period: str, minute_second: int, additional_minute_second: int):
    """Função pura que valida as regras físicas do esporte."""
    if period == 'HT' and additional_minute_second > 0:
        raise ValueError("O intervalo (HT) não pode ter acréscimos.")

    if period in STR_PERIOD_LIMITS:
        limit = STR_PERIOD_LIMITS[period]
        if minute_second > limit:
            raise ValueError(f"O período {period} não pode ultrapassar {limit} segundos.")
        if additional_minute_second > 0 and minute_second != limit:
            raise ValueError(f"Acréscimos no período {period} só podem ser registrados exatamente aos {limit} segundos.")


@total_ordering
@dataclass(frozen=True)  # frozen=True garante que seja imutável, uma boa prática para Value Objects
class MatchTime:
    period: MatchPeriod
    minute_second: int
    additional_minute_second: int = 0


    def __post_init__(self):
        check_football_limits(
            period=self.period.value,
            minute_second=self.minute_second,
            additional_minute_second=self.additional_minute_second
        )

    # '__lt__' Implementa o operador: '<'
    def __lt__(self, other: 'MatchTime') -> bool:
        # Verifica se o outro objeto é MatchTime
        if not isinstance(other, MatchTime):
            return NotImplemented

        # Compara os períodos
        weight_self = PERIOD_ORDER.get(self.period, 0)
        weight_other = PERIOD_ORDER.get(other.period, 0)

        if weight_self != weight_other:
            return weight_self < weight_other

        # Se for o mesmo período, compara o minuto regular
        if self.minute_second != other.minute_second:
            return self.minute_second < other.minute_second

        # Se for o mesmo minuto, compara o acréscimo
        return self.additional_minute_second < other.additional_minute_second



    def __eq__(self, other: object) -> bool:
        if not isinstance(other, MatchTime):
            return NotImplemented

        return (self.period == other.period and
                self.minute_second == other.minute_second and
                self.additional_minute_second == other.additional_minute_second)