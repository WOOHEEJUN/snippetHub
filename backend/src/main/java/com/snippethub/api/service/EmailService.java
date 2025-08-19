package com.snippethub.api.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendVerificationEmail(String to, String token) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("SnippetHub 회원가입 이메일 인증");
            helper.setText("다음 링크를 클릭하여 회원가입을 완료해주세요: "
                    + "https://snippet.co.kr/api/auth/verify?token=" + token);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new RuntimeException("이메일 전송 중 오류 발생", e);
        }
    }

    public void sendPasswordResetEmail(String to, String token) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("SnippetHub 비밀번호 재설정");
            helper.setText("다음 링크를 클릭하여 비밀번호를 재설정해주세요: "
                    + "https://snippet.co.kr/reset-password?token=" + token);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new RuntimeException("이메일 전송 중 오류 발생", e);
        }
    }
}
