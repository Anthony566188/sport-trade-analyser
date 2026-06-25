from dataclasses import dataclass
from functools import total_ordering
from typing import Dict, Tuple

from models.enums.match_period import MatchPeriod, PERIOD_ORDER


# CONSTANTE GLOBAL
# Define as fronteiras (Piso, Teto) em segundos para cada período
PERIOD_BOUNDARIES: Dict[MatchPeriod, Tuple[int, int]] = {
    MatchPeriod.FIRST_HALF: (0, 2700),      # 0 a 45 min
    MatchPeriod.HALF_TIME: (2700, 2700),    # Cravado nos 45 min (sem tempo corrido)
    MatchPeriod.SECOND_HALF: (2700, 5400),  # 45 a 90 min
    MatchPeriod.EXTRA_FIRST: (5400, 6300),  # 90 a 105 min
    MatchPeriod.EXTRA_SECOND: (6300, 7200)  # 105 a 120 min
}

# Dicionário derivado automático para validações textuais
# Resultado gerado: {'1H': (0, 2700), 'HT': (2700, 2700), '2H': (2700, 5400)...}
STR_PERIOD_BOUNDARIES: Dict[str, Tuple[int, int]] = {
    period.value: boundaries for period, boundaries in PERIOD_BOUNDARIES.items()
}

def check_football_limits(period: str, minute_second: int, additional_minute_second: int):
    """Função pura que valida as regras físicas do esporte.
    (Valida se pode acrescimo e se o tempo condiz com o periodo)"""

    try:
        period = MatchPeriod(period)
    except ValueError:
        raise ValueError(f"Período '{period}' inválido! Os valores aceitos para os períodos são: '1H'; '2H'; 'HT'; 'E1'; 'E2'.")


    if period == 'HT' and additional_minute_second > 0:
        raise ValueError("O intervalo (HT) não pode ter acréscimos.")

    if period in STR_PERIOD_BOUNDARIES:
        min_limit, max_limit = STR_PERIOD_BOUNDARIES[period]

        # Valida o Piso - Impede registrar tempo do passado no futuro
        if minute_second < min_limit:
            raise ValueError(
                f"Inconsistência de período: O tempo para o período {period} "
                f"não pode ser inferior a {min_limit} segundos."
            )

        # Valida o Teto - Impede estourar o tempo regulamentar
        if minute_second > max_limit:
            raise ValueError(
                f"O tempo regulamentar para o período {period} "
                f"não pode ultrapassar {max_limit} segundos."
            )

        # Valida se os acréscimos estão no exato limite do período (Teto)
        if additional_minute_second > 0 and minute_second != max_limit:
            raise ValueError(
                f"Acréscimos no período {period} só podem ser "
                f"registrados exatamente aos {max_limit} segundos."
            )

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