package com.snippethub.api.exception;

public class NicknameDuplicateException extends BusinessException {

    public NicknameDuplicateException() {
        super(ErrorCode.NICKNAME_DUPLICATION);
    }
}
