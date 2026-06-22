from typing import Optional

from pydantic import BaseModel, model_validator
from decimal import Decimal

from models.bet import Bet
from models.enums.bet_type import BetType
from models.enums.match_period import MatchPeriod
from models.value_objects.match_time import MatchTime, check_football_limits


class UpdateBetRequest(BaseModel):
    id_method: int
    id_match: int
    stake: Decimal
    entry_odd: Decimal
    type: BetType
    exit_odd: Optional[Decimal]
    # Trinca de entrada
    entry_period: MatchPeriod
    entry_minute_second: int
    entry_additional_minute_second: int = 0
    # Trinca de saída
    exit_period: Optional[MatchPeriod] = None
    exit_minute_second: Optional[int] = None
    exit_additional_minute_second: int = 0

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def validate_chronology(self):
        try:
            # Valida obrigatoriamente os limites físicos da entrada
            check_football_limits(self.entry_period.value, self.entry_minute_second,
                                  self.entry_additional_minute_second)

            # Instancia o objeto de valor da entrada
            time_entry = MatchTime(
                period=self.entry_period,
                minute_second=self.entry_minute_second,
                additional_minute_second=self.entry_additional_minute_second
            )

            # Só valida a saída se o período de saída E o minuto forem fornecidos (Aposta Fechada)
            if self.exit_period is not None and self.exit_minute_second is not None:
                check_football_limits(self.exit_period.value, self.exit_minute_second,
                                      self.exit_additional_minute_second)

                time_exit = MatchTime(
                    period=self.exit_period,
                    minute_second=self.exit_minute_second,
                    additional_minute_second=self.exit_additional_minute_second
                )

                # Validação da Flecha do Tempo
                if time_exit < time_entry:
                    raise ValueError(
                        "Inconsistência temporal: O tempo de saída da aposta "
                        "não pode ser cronologicamente anterior ao tempo de entrada."
                    )

            # Se foi mandado odd de saída mas faltam dados de tempo de saída, gera erro consistente
            elif self.exit_odd is not None and (self.exit_period is None or self.exit_minute_second is None):
                raise ValueError("Para fechar uma aposta (enviar exit_odd), a trinca temporal de saída deve ser preenchida completamente.")

        except ValueError as e:
            raise ValueError(str(e))

        return self

    def to_entity(self) -> Bet:
        return Bet(
            id_method=self.id_method,
            id_match=self.id_match,
            stake=self.stake,
            entry_odd=self.entry_odd,
            type=self.type.value,
            exit_odd=self.exit_odd,
            entry_period=self.entry_period.value if self.entry_period else None,
            entry_minute_second=self.entry_minute_second,
            entry_additional_minute_second=self.entry_additional_minute_second,
            exit_period=self.exit_period.value if self.exit_period else None,
            exit_minute_second=self.exit_minute_second,
            exit_additional_minute_second=self.exit_additional_minute_second,
        )