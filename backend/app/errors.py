class OmrError(Exception):
    def __init__(self, message: str, *, code: str = "OMR_ERROR", status_code: int = 422):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
