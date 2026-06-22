class BetChronologyError(ValueError):
    def __init__(self, message="O tempo de saída da aposta não pode ser anterior ao tempo de entrada."):
        super().__init__(message)

class InvalidPeriodError(ValueError):
    def __init__(self, message="O período informado para a aposta é inválido."):
        super().__init__(message)

class InvalidBetTypeError(ValueError):
    def __init__(self, message="Tipo de aposta inválido, deve ser 'BACK' ou 'LAY'"):
        super().__init__(message)

class InvalidBetStakeError(ValueError):
    def __init__(self, message="O valor da aposta deve ser maior que 0"):
        super().__init__(message)

class InvalidBetOddError(ValueError):
    def __init__(self, message="O valor da odd deve ser maior que 1.0"):
        super().__init__(message)

class BetEntryTimeError(ValueError):
    def __init__(self, message="O tempo da entrada deve ser maior ou igual a 0"):
        super().__init__(message)

class EventOrCriterionError(ValueError):
    def __init__(self, message="Deve ser passado apenas o critério ou o evento, nunca os dois nem nenhum"):
        super().__init__(message)

class AdditionalTimeError(ValueError):
    def __init__(self, message="O acréscimo não pode ser aplicado neste tempo"):
        super().__init__(message)