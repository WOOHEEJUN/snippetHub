package com.snippethub.api.exception;

public class EmailDuplicateException extends BusinessException {

    public EmailDuplicateException() {
        super(ErrorCode.EMAIL_DUPLICATION);
    }
}
